# Student Robotics Competition Screens

This repository contains the web pages for the various screens that are
displayed at the competition.

## Configuration

Create a file called `config.json` based on `config.example.json`.

```json
{
  "displayConfig": {
    // Base url to an instance of the competition-website, shown on outside.html
    // and intended to allow viewers to visit a page with similar information on
    // their own device.
    "externalUrl": "srobo.org/comp/",
    // Pages within the rotating collection used by outside.html which should be
    // hidden. For example if a competition does not want to show the knockout
    // page then this would be ["sr-knockout-diagram"].
    "hideOutsidePages": [],
    // How many "rounds" to show on the knockouts page of the "outside" screen.
    "maxKnockoutRounds": 5,
    // Used to control the corner columns as shown on the staging screen (useful
    // if the table doesn't match the default ordering). If the set of corners
    // doesn't match the set of corners configured in the compstate (usually
    // `["0", "1", "2", "3"]`), a warning is printed to the browser console
    // and the default corners are used.
    "stagingCornersList": ["0", "3", "2", "1"]
  },
  "apiurl": "http://localhost/comp-api",
  "streamurl": "http://localhost/stream"
}
```

`apiurl` and `streamurl` are required and should point to instances of the SRComp HTTP API and Stream respectively.
`displayConfig` is optional and if present its keys will be merged with the defaults (the above values are the defaults).

## Installation & Running

Dependencies are managed with [Yarn](https://yarnpkg.com/getting-started/install),
therefore you must install them in the normal way:

    $ yarn install

The best way to test these screens is to run an HTTP server in the root of your
clone and navigate to it with your web browser.

    $ python3 -m http.server

## Browser support

The canonical platform for these screens is the browsers available on
the current version of Raspbian and as configured by [srcomp-kiosk][srcomp-kiosk].
This generally means Firefox and Chromium.

Current versions of Firefox and Chromium should also work, primarily so
that development is easy without a Raspberry Pi.

Microsoft Edge (pre-Chromium) is known not to work, due to a lack of support
for the `EventSource` API.

[srcomp-kiosk]: https://github.com/PeterJCLaw/srcomp-kiosk

## Screens

Here are the screens that are in this repository.

### Arena

This screen is displayed in each corner of the arena.

You can configure which corner the screen should be displaying by altering the
query parameters:

    /arena.html?<arena>,<corner>

### Outside

This screen is available to competitors at some strategic points around the
competition venue. It displays information such as the current leaderboard, the
match schedule, the scores and the knockout diagram.

## Components

The screens use [Web Components](http://webcomponents.org/) and
[Polymer](https://www.polymer-project.org/) to make the code more maintainable,
flexible and reusable. They are stored in the `components` folder.
