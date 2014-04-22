var arena = (function(arena) {
    "use strict";

    var updateElementIfNecessary = function(element, textContent, className) {
        if (element) {
            if (element.textContent !== textContent) {
                element.textContent = textContent;
            }

            if (className !== undefined) {
                if (element.className !== className) {
                    element.className = className;
                }
            }
        }
    };

    var Corner = window.Corner = function(colour, small) {
        this.element = document.createElement("div");
        this.element.classList.add("corner");
        if (small) {
            this.element.classList.add("small");
        }

        var sidebar = document.createElement("aside");
        sidebar.style.backgroundColor = colour;
        this.element.appendChild(sidebar);

        var main = document.createElement("main");

        if (!small) {
            this.matchNumberElement = document.createElement("h2");
            main.appendChild(this.matchNumberElement);
        }

        this.teamElement = document.createElement("h1");
        main.appendChild(this.teamElement);

        if (!small) {
            this.timeLeftElement = document.createElement("p");
            main.appendChild(this.timeLeftElement);
        }

        this.element.appendChild(main);

        this.element.appendChild(sidebar.cloneNode(false));
    };

    Corner.prototype.update = function(team, matchNumber, delay) {
        updateElementIfNecessary(this.matchNumberElement, "Match " + matchNumber);
        updateElementIfNecessary(this.timeLeftElement, utils.formatTimeDelta(delay));

        if (team) {
            var className = team.length === 4 ? "small" : "";
            updateElementIfNecessary(this.teamElement, team, className);
        } else {
            updateElementIfNecessary(this.teamElement, "", "");
        }
    };

    var CornersView = function(cornerDefs, mainCorner) {
        var main = document.createElement("main");
        var aside = document.createElement("aside");

        this.corners = [];
        cornerDefs.forEach(function(cornerDef, i) {
            var small = i !== mainCorner;
            var corner = new Corner(cornerDef.colour, small);
            if (small) {
                aside.appendChild(corner.element);
            } else {
                main.appendChild(corner.element);
            }

            this.corners.push(corner);
        }.bind(this));

        this.element = document.createElement("section");
        this.element.classList.add("view");
        this.element.classList.add("corners");
        this.element.appendChild(main);
        this.element.appendChild(aside);
    };

    CornersView.prototype.update = function(currentMatch, nextMatch) {
        this.corners.forEach(function(corner, i) {
            if (!currentMatch && !nextMatch) {
                // TODO: implement
            } else {
                var timeToStart = nextMatch.secondsToStart();
                if (timeToStart <= 120 || !currentMatch) {
                    corner.update(nextMatch.teams[i], nextMatch.number,
                                -timeToStart);
                } else {
                    var timeToEnd = currentMatch.secondsToEnd() - 120;
                    corner.update(currentMatch.teams[i], currentMatch.number,
                                timeToEnd);
                }
            }
        });
    };

    var BigView = function() {
        var main = document.createElement("main");
        this.h1 = document.createElement("h1");
        main.appendChild(this.h1);

        this.element = document.createElement("section");
        this.element.classList.add("view");
        this.element.classList.add("big");
        this.element.appendChild(main);
    };

    BigView.prototype.update = function(text) {
        if (this.h1.textContent !== text) {
            this.h1.textContent = text;
        }
    };

    var Match = function(def) {
        this.teams = def.teams;
        this.number = this.id = def.number;
        this.startTime = new Date(def.start_time);
        this.endTime = new Date(def.end_time);
    };

    Match.prototype.secondsToStart = function() {
        return parseInt((this.startTime - new Date()) / 1000);
    };

    Match.prototype.secondsToEnd = function() {
        return parseInt((this.endTime - new Date()) / 1000);
    };

    var getCurrentAndNextMatch = function(arena, callback) {
        srobo.competition.matches(arena, "current,next", function(res) {
            var m = res.matches;
            var m0 = m[0].error ? null : new Match(m[0]);
            var m1 = m[1].error ? null : new Match(m[1]);
            callback(m0, m1);
        });
    };

    arena.init = function() {
        srobo.init(function() {
            var badCorner = function(cornerDefs) {
                var buttonsDiv = document.createElement("div");
                var showButtons = function(cornerDefs) {
                    srobo.competition.arenas(function(arenas) {
                        arenas = arenas.arenas;
                        for (var i = 0; i < arenas.length; i++) {
                            var arena = arenas[i];
                            var para = document.createElement("p");
                            for (var c = 0; c < cornerDefs.length; c++) {
                                var link = document.createElement("a");
                                link.href = "?arena=" + arena + "&corner=" + c;
                                link.textContent = arena + ":" + c;
                                link.style = "padding: 0.5em; margin: 0.5em; font-size: 1.2em;";
                                para.appendChild(link);
                            }
                            buttonsDiv.appendChild(para);
                        }
                    });
                };

                if (cornerDefs != null) {
                    showButtons(cornerDefs);
                } else {
                    srobo.competition.corners(showButtons);
                }

                var h2 = document.createElement("h2");
                h2.textContent = "Invalid arena corner specified";
                document.body.appendChild(h2);
                var h3 = document.createElement("h3");
                h3.textContent = "Please choose a suitable corner:";
                document.body.appendChild(h3);
                document.body.appendChild(buttonsDiv);
            };

            // load which arena corner were are from url parameters.
            var pairs = window.location.search.substr(1).split("&");
            var args = {};
            for (var i = 0; i < pairs.length; i++) {
                var bits = pairs[i].split("=");
                args[bits[0]] = bits[1];
            }
            var arenaId = args["arena"];
            var cornerId = parseInt(args["corner"], 10);

            if (arenaId == null || arenaId.length === 0 || isNaN(cornerId)) {
                badCorner();
                return;
            }

            var loadCorners = function(mainCorner, callback) {
                srobo.competition.corners(function(cornerDefs) {
                    if (mainCorner > cornerDefs.length) {
                        badCorner(cornerDefs);
                        return;
                    }

                    var corners = new CornersView(cornerDefs, mainCorner);
                    document.body.appendChild(corners.element);
                    callback(corners);
                });
            };

            loadCorners(cornerId, function(corners) {
                var countdownView = new BigView();
                countdownView.element.hidden = true; // start hidden
                document.body.appendChild(countdownView.element);

                countdownView.update("5");

                var currentMatch = undefined;
                var nextMatch = undefined;

                // timer to update the match data at regular intervals
                var updateModel = function() {
                    getCurrentAndNextMatch(arenaId, function(current, next) {
                        if (currentMatch === undefined) {
                            window.requestAnimationFrame(updateView);
                        }

                        currentMatch = current;
                        nextMatch = next;
                    });
                };

                setInterval(updateModel, 1000);
                updateModel();

                // timer to redraw the UI faster than the data is updated
                var updateView = function() {
                    var timeToStart = nextMatch.secondsToStart();
                    if (timeToStart <= 5 && timeToStart > 0) {
                        if (countdownView.element.hidden) {
                            countdownView.element.hidden = false;
                        }
                        countdownView.update(timeToStart);
                    } else {
                        if (!countdownView.element.hidden) {
                            countdownView.element.hidden = true;
                        }
                    }

                    corners.update(currentMatch, nextMatch);
                    window.requestAnimationFrame(updateView);
                };
            });
        });
    };

    return arena;
}(arena || {}));