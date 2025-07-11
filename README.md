# bs-table

**bs-table** is a lightweight and user-friendly table plugin for Bootstrap, designed to efficiently manage tables with a streamlined configuration and extensive customization options.

---

## Table Options Reference

Below is the **complete list** of options available for **bs-table** with detailed explanations for each.

---

### General Table Options

| **Option**               | **Type**               | **Default**                        | **Description**                                                                                              |
|--------------------------|------------------------|------------------------------------|--------------------------------------------------------------------------------------------------------------|
| `classes`                | `string | object`     | `'table'`                          | CSS classes for the table. Can target specific elements like `thead`, `tbody`, or `tfoot`.                   |
| `toolbar`                | `string | $`          | `null`                             | Selector or jQuery object for the toolbar.                                                                  |
| `pagination`             | `boolean`             | `false`                            | Enables/disables pagination controls.                                                                       |
| `sidePagination`         | `string`              | `'client'`                         | Determines if pagination is done on `'client'` or `'server'`.                                               |
| `paginationVAlign`       | `string`              | `'bottom'`                         | Vertical alignment: `'top'`, `'bottom'`, or `'both'`.                                                       |
| `paginationHAlign`       | `string`              | `'end'`                            | Horizontal alignment: `'start'` or `'end'`.                                                                 |
| `pageNumber`             | `number`              | `1`                                | Initial page number when table loads.                                                                       |
| `pageSize`               | `number`              | `10`                               | Number of rows per page.                                                                                    |
| `pageList`               | `array<number>`       | `[5, 10, 25, 50, 100, 200, 'All']` | Dropdown options for the number of rows per page.                                                           |
| `search`                 | `boolean`             | `false`                            | Adds a search bar for filtering rows.                                                                       |
| `url`                    | `string | function`   | `null`                             | Source of data for the table. Accepts an API endpoint or a function returning a Promise.                     |
| `data`                   | `array`               | `null`                             | Static array of data objects. Overrides `url` if defined.                                                   |
| `debug`                  | `boolean`             | `false`                            | Enables debugging mode, which logs events and table interactions.                                           |

---

### Sorting Options

| **Option**               | **Type**               | **Default**  | **Description**                                                                                      |
|--------------------------|------------------------|--------------|------------------------------------------------------------------------------------------------------|
| `sortName`               | `string`              | `null`       | Specifies the data field to sort by on table initialization.                                         |
| `sortOrder`              | `string`              | `'asc'`      | Default sorting order. Possible values are `'asc'` (ascending) or `'desc'` (descending).             |
| `onSort`                 | `function`            |              | Callback triggered when a column is sorted. Receives `field` and `order` as arguments.              |

---

### Advanced Features

| **Option**               | **Type**               | **Default**                | **Description**                                                                                      |
|--------------------------|------------------------|----------------------------|------------------------------------------------------------------------------------------------------|
| `showFooter`             | `boolean`             | `false`                    | Displays a table footer.                                                                             |
| `showHeader`             | `boolean`             | `true`                     | Controls the visibility of the table header.                                                        |
| `formatNoMatches`        | `function`            | Custom HTML                | Message displayed when no matching rows are found.                                                  |
| `showColumns`            | `boolean`             | `false`                    | Displays a dropdown for toggling column visibility.                                                 |
| `minimumCountColumns`    | `number`              | `1`                        | Minimum number of visible columns when `showColumns` is enabled.                                    |
| `customView`             | `boolean`             | `false`                    | Enables a custom rendering view for rows.                                                           |
| `onCustomView`           | `function`            |                              | Callback function for rendering rows when `customView` is enabled.                                  |

---

### Column Options

Columns are defined in the `columns` array. Each column object accepts the following options:

| **Option**               | **Type**               | **Default**                | **Description**                                                                                      |
|--------------------------|------------------------|----------------------------|------------------------------------------------------------------------------------------------------|
| `field`                  | `string`              |                              | The data field to map onto this column.                                                             |
| `title`                  | `string`              |                              | Header text for the column.                                                                         |
| `sortable`               | `boolean`             | `false`                    | Enables sorting for this column.                                                                    |
| `align`                  | `string`              | `'left'`                   | Horizontal alignment of column cells. Can be `'left'`, `'center'`, or `'right'`.                    |
| `valign`                 | `string`              | `'top'`                    | Vertical alignment. Can be `'top'`, `'middle'`, or `'bottom'`.                                      |
| `formatter`              | `function`            |                              | Function to customize the rendering of cell values.                                                 |
| `width`                  | `string`              |                              | Sets the width of the column (e.g., `'100px'`).                                                     |
| `checkbox`               | `boolean`             | `false`                    | Adds a checkbox to the column for selection purposes.                                               |
| `radio`                  | `boolean`             | `false`                    | Adds a radio button to the column for row selection.                                                |

---

### Events

`bs-table` provides rich event-driven functionalities. Below is a complete list of events:

| **Event Name**           | **Callback Parameters**     | **Description**                                                                                     |
|--------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------|
| `onAll`                  | `eventName, ...args`       | Global event that listens to all table actions.                                                    |
| `onLoadSuccess`          | `(rows, $table)`           | Triggered when data is successfully loaded into the table.                                          |
| `onLoadError`            |                             | Triggered when there is an error loading data into the table.                                       |
| `onPreBody`              | `(rows, $table)`           | Triggered before the table body is rendered.                                                       |
| `onPostBody`             | `(rows, $table)`           | Triggered after the table body rendering is complete.                                              |
| `onClickCell`            | `(field, value, row, $td)` | Triggered when a specific cell is clicked.                                                         |
| `onClickRow`             | `(row, $tr)`               | Triggered when a table row is clicked.                                                             |
| `onSort`                 | `(field, order)`           | Triggered when a column is sorted.                                                                 |
| `onRefresh`              |                             | Triggered when the table is refreshed through the refresh button.                                   |

**Example: Event Listener**
````javascript
$('#example-table').on('click-row.bs.table', function (event, row, $tr) {
    console.log('Row clicked:', row);
});
````

---

## How to Customize bs-table

### Example Scenario: Full Feature Setup

````javascript
$('#example-table').bsTable({
    search: true,
    pagination: true,
    pageSize: 15,
    showColumns: true,
    columns: [
        {
            field: 'id',
            title: 'ID',
            sortable: true,
            align: 'center'
        },
        {
            field: 'name',
            title: 'Name',
            formatter: value => `<strong>${value}</strong>`
        },
        {
            field: 'description',
            title: 'Description',
            valign: 'middle'
        }
    ],
    onClickRow: function (row, $tr) {
        alert('Row clicked: ' + JSON.stringify(row));
    }
});
````

---

## License

**Proprietary**  
Contact the author for licensing inquiries.

---

## Author

**Thomas Kirsch**  
Email: [t.kirsch@webcito.de](mailto:t.kirsch@webcito.de)