## Ranked Choice Voting Visualization

This application visualizes ranked choice voting results, allowing viewers to interact with the data. See the application in action here:

https://democracy-for-america.github.io/rcv/

Follow the instructions below to present your own data.

## Formatting your data

This application requires two CSVs: one candidates CSV, and one poll results CSV.

#### Candidates CSV

The candidates CSV must contain `id` and `name` columns, and may contain an optional `image_url` column. The `id` values must be alphanumeric (no spaces), but may otherwise follow any convention. (If using YouGov polling results, the candidate IDs should correspond to those provided by the YouGov codebook.) The `image_url` values may be full URLs or relative paths.

Polling agencies such as YouGov use special codes to indicate responses like "none of the above" (code: 997) or "skipped question" (code: 998). To accommodate these answers, create a candidate ID by prefixing a YouGov code with the letter "A" to include corresponding selections in the interactive results, or "X" to exclude them, and append a row to the candidates CSV.

Example candidates CSV:

```
id,name,image_url
Q8_1,Michael Bennet,/images/MichaelBennet.jpg
Q8_2,Joe Biden,/images/JoeBiden.jpg
Q8_3,Cory Booker,/images/CoryBooker.jpg
Q8_4,Steve Bullock,/images/SteveBullock.jpg
Q8_5,Pete Buttigieg,/images/PeteButtigieg.jpg
Q8_6,Julián Castro,/images/JulianCastro.jpg
Q8_7,Bill de Blasio,/images/BilldeBlasio.jpg
Q8_8,John Delaney,/images/JohnDelaney.jpg
Q8_9,Tulsi Gabbard,/images/TulsiGabbard.jpg
Q8_11,Kamala Harris,/images/KamalaHarris.jpg
Q8_12,Amy Klobuchar,/images/AmyKlobuchar.jpg
Q8_13,Wayne Messam,/images/WayneMessam.jpg
Q8_14,Beto O'Rourke,/images/BetoORourke.jpg
Q8_15,Tim Ryan,/images/TimRyan.jpg
Q8_16,Bernie Sanders,/images/BernieSanders.jpg
Q8_17,Joe Sestak,/images/JoeSestak.jpg
Q8_18,Tom Steyer,/images/TomSteyer.jpg
Q8_19,Elizabeth Warren,/images/ElizabethWarren.jpg
Q8_20,Marianne Williamson,/images/MarianneWilliamson.jpg
Q8_21,Andrew Yang,/images/AndrewYang.jpg
A997,None of the above,/images/None.jpg
X998,,
```

#### Poll Results CSV

Results CSVs may be formatted in one of two conventions:

`yougov`: headers correspond to candidate IDs, and cell values contain integers indicating ordinal rankings, e.g.:

```
Q8_1,Q8_2,Q8_3
1,2,3
3,2,1
```

`ordinal`: headers consist of integers representing ordinal rankings, and cell values correspond to candidate IDs:

```
1,2,3
Q8_1,Q8_2,Q8_3
Q8_3,Q8_2,Q8_1
```

Results CSVs may contain an optional `weight` column consisting of decimal values to accommodate weighted poll results, and additional demographic columns (`gender`, `race`, `age`, etc.) which may be used for filtering.

Data provided by a polling agency such as YouGov may be formatted as an `.sav` file. This file format may be converted to a CSV using an online converter such as https://pspp.benpfaff.org/. (Once converted to a CSV, no further formatting is necessary.)

#### CSV file hosting requirements

Due to cross-origin request sharing (CORS) browser security safeguards, CSVs must be hosted on the same domain as the interactive results or on an endpoint with CORS enabled (e.g. GitHub pages or Amazon Web Services S3).

Upload the candidates and results CSVs to an appropriate destination, and note the URLs.

## Embedding interactive ranked choice voting results

The interactive ranked choice voting visualization may be embedded as an iframe or by directly loading JavaScript. Either way, the following configuration options must be included as hash fragments (for iframes) or arguments passed to the `rcvInitialize()` function (for JavaScript):

`candidatesCsvUrl`: the candidates CSV's URL (may be a full URL or a relative path)

`resultsCsvUrl`: the results CSV's URL (may be a full URL or a relative path)

`headersFormat`: the format of the candidates CSV's headers - `yougov` (default if not provided) or `ordinal`

If using a CMS such as NationBuilder, edit a page's template and insert one of the following HTML snippets to display the interactive visualization.

#### Example iframe Embed:

```html
<iframe src="//Democracy-for-America.github.io/rcv/iframe.html#candidatesCsvUrl=data/candidates-20.csv&resultsCsvUrl=data/yougov-results.csv&headersFormat=yougov" style="width: 100%; height: 700px; border: 1px solid #ccc;"></iframe>
```

#### Example JavaScript code:

```html
<link rel="stylesheet" href="//Democracy-for-America.github.io/rcv/css/rcv-auto.css">
<script src="//Democracy-for-America.github.io/rcv/js/rcv-yougov-auto.js"></script>

<div id="rcv-candidates"></div>

<script>
  rcvInitialize({
    candidatesCsvUrl: "//Democracy-for-America.github.io/rcv/data/candidates-20.csv",
    resultsCsvUrl: "//Democracy-for-America.github.io/rcv/data/dfa-results.csv",
    headersFormat: "yougov"
  });
</script>
```

## Further customization

#### Automatic winner selection

The ranked choice winner may be selected by removing the last place candidate one by one until the first place candidate reaches a 50%-plus majority. If embedding JavaScript, a clickable link that triggers the automatic selection of a poll's ranked choice winner may be added by including a link element classed with `rcv-autoselect`:

```html
<a class="rcv-autoselect" href="#">Show me the ranked choice winner</a>
```

#### Weighting

If a results CSV contains a `weight` column, a `weighted=true` (for iframes) or `weighted: true` (for JavaScript) argument may be used to weight poll results.

#### Demographic filtering

If a results CSV contains demographic identifier columns (e.g. gender, race, age, level of education), voters may be filtered to show results for given demographic groups.

Demographic filters may be passed via URL hash fragments:

```https://Democracy-for-America.github.io/rcv/#gender=2&race=2```

Or via the `rcvInitialize()` JavaScript function's `criteria` parameter:

```javascript
rcvInitialize({
  candidatesCsvUrl: "data/candidates-20.csv",
  resultsCsvUrl: "data/dfa-results.csv",
  headersFormat: "yougov",
  criteria: {
    gender: "2",
    race: "2"
  }
});
```

Additionally, demographic filters may use the `+` operator to combine multiple segments:

```https://Democracy-for-America.github.io/rcv/#educ=1+2+3+4```

```javascript
  criteria: {
    educ: "1+2+3+4"
  }
```

And the `>`, `<`, `>=` & `<=` operators for numerical values:

```https://Democracy-for-America.github.io/rcv/#birthyr>=1970```

```javascript
  criteria: {
    birthyr: ">=1970"
  }
```

#### Demographic quick links

A table of demographic filter links may be prepended to the interactive visualization by passing a nested array of demographic filters to the `rcvInitialize()` function's `filters` parameter:

```javascript
rcvInitialize({
  candidatesCsvUrl: "data/candidates-20.csv",
  resultsCsvUrl: "data/yougov-results.csv",
  headersFormat: "yougov",
  filters: [
    [['Everyone', '']],
    [['Men', 'gender=1'], ['Women', 'gender=2']],
    [['Black voters', 'race=2'], ['Hispanic voters', 'race=3'], ['White voters', 'race=1']],
    [['College-educated voters', 'educ=5+6'], ['Non College-educated voters', 'educ=1+2+3+4']],
    [['Voters born before 1970', 'birthyr<1970'], ['Voters born 1970 or after', 'birthyr>=1970']]
  ]
});
```

(Each nested array corresponds to a separate line, allowing easy grouping.)

#### Multiple surveys

A table of links allowing viewers to switch back and forth between multiple datasets may be prepended to the interactive visualiztion by passing a nested array of datasets to the `rcvInitialize()` function's `datasets` parameter (assume the files `data/candidates-20.csv` and `data/candidates-5.csv` correspond to full and reduced sets of candidates from a YouGov survey):

```javascript
var c20 = "data/us/candidates-20.csv";
var c5  = "data/us/candidates-5.csv";
var results = "data/us/results-yougov.csv";

rcvInitialize({
  candidatesCsvUrl: c20,
  resultsCsvUrl: results,
  headersFormat: "yougov",
  weighted: true,
  datasets: [[
    ["Full 20 candidate survey", "20-candidates", {candidatesCsvUrl: c20}],
    ["Reduced 5 candidate survey", "5-candidates", {candidatesCsvUrl: c5}]
  ]]
});
```

## License

This software is released under a GPLv3 license which requires that deployment of this application or derivitive works maintain a visible "Website powered by Fairvote and Democracy for America" credit below any presentation of the interactive widget.