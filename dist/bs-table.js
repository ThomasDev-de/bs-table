(function ($) {
    "use strict";

    /* jshint unused:false */
    $.bsTable = {
        version: '1.0.2', globalEventsBound: false, setDefaults(options) {
            this.defaults = $.extend(true, {}, this.defaults, options || {});
        }, getDefaults() {
            return this.defaults;
        }, defaults: {
            height: undefined,
            ajaxOptions: undefined,
            classes: 'table',
            toolbar: undefined,
            pagination: false,
            sidePagination: 'client',
            paginationVAlign: 'bottom',
            paginationHAlign: 'end',
            pageNumber: 1,
            pageSize: 10,
            pageList: [5, 10, 25, 50, 100, 200, 'All'],
            search: false,
            sortName: null,
            sortOrder: 'asc',
            showRefresh: false,
            showHeader: true,
            showFooter: false,
            showToggle: false,
            showColumns: false,
            showCheckItems: false,
            checkItemConfig: {
                type: 'checkbox', // checkbox or radio
                field: 'id', // the value field
                name: 'btSelectItem', // When Typ Checkbox is, the name is converted to an array
                clickRowToSelect: true // CheckItem toggle on click row
            },
            cardView: false,
            showCustomView: false,
            customView: false,
            onCustomView(_rows, _$td) {
            },
            url: null,
            data: null,
            columns: [],
            minimumCountColumns: 1,
            idField: undefined,
            selectItemName: 'btSelectItem',
            clickToSelect: false,
            icons: {
                sortAsc: 'bi bi-caret-down-fill text-primary',
                sortDesc: 'bi bi-caret-up-fill text-primary',
                sortNone: 'bi bi-caret-down',
                refresh: 'bi bi-arrow-clockwise',
                search: 'bi bi-search',
                paginationNext: 'bi bi-chevron-right',
                paginationPrev: 'bi bi-chevron-left',
                toggleOff: 'bi bi-toggle-off',
                toggleOn: 'bi bi-toggle-on',
                customViewOff: 'bi bi-columns-gap',
                customViewOn: 'bi bi-table',
            },
            rowStyle(_row, _index, _$tr) {
            },
            queryParams(_params) {
                return _params;
            },
            responseHandler(_res) {
                return _res;
            },
            caption: null,
            onAll(_eventName, ..._args) {
            },
            onLoadSuccess() {
            },
            onLoadError() {
            },
            onPreBody(_rows, _$table) {
            },
            onPostHeader(_$thead, _$table) {
            },
            onPostBody(_rows, _$table) {
            },
            onPostFooter(_$tfoot, _$table) {
            },
            onRefresh(_params) {
            },
            onSort(_name, _order) {
            },
            onClickCell(_field, _value, _row, _$td) {
            },
            onClickRow(_row, _$tr, _field) {
            },
            onCheck(_row, _$input) {
            },
            onCheckAll() {
            },
            onUncheck(_row, _$input) {
            },
            onUncheckAll() {
            },
            formatNoMatches() {
                return `<i class="bi bi-x-lg fs-1 text-danger"></i>`;
            },
            formatSearch() {
                return `...`
            },
            formatShowingRows(_pageFrom, _pageTo, _totalRows) {
                return `Showing ${_pageFrom} to ${_pageTo} of ${_totalRows} rows`;
            },
            formatRecordsPerPage() {
                return `records per page`;
            },
            debug: false
        },
        columnDefaults: {
            class: undefined,
            field: undefined,
            checkbox: false,
            radio: false,
            sortable: false,
            visible: true,
            width: undefined,
            valign: 'middle',
            align: 'left',
            halign: 'start',
            falign: 'start',
            formatter: undefined,
            footerFormatter: undefined,
            events: undefined
        },
        utils: {
            sortArrayByField(data, field, order = "ASC") {
                // Sicherstellen, dass die Reihenfolge korrekt ist
                const direction = order.toUpperCase() === "DESC" ? -1 : 1;

                return data.sort((a, b) => {
                    // NULL-Werte nach hinten sortieren
                    if (a[field] == null && b[field] == null) {
                        return 0;
                    } // Beide NULL
                    if (a[field] == null) {
                        return 1 * direction;
                    } // `a` ist NULL → `b` vorher
                    if (b[field] == null) {
                        return -1 * direction;
                    } // `b` ist NULL → `a` vorher

                    // Zahlen- oder Stringvergleich
                    const aValue = typeof a[field] === "number" ? a[field] : a[field].toString().toLowerCase();
                    const bValue = typeof b[field] === "number" ? b[field] : b[field].toString().toLowerCase();

                    if (aValue > bValue) {
                        return 1 * direction;
                    }
                    if (aValue < bValue) {
                        return -1 * direction;
                    }

                    // Alles gleich: Reihenfolge beibehalten
                    return 0;
                });
            }, calculateVisiblePagesOnNavigation(totalPages, currentPage) {
                const visiblePages = [];

                // Fall 1: Aktuelle Seite ist in den ersten 4 Seiten
                if (currentPage <= 4) {
                    for (let i = 1; i <= Math.min(5, totalPages); i++) {
                        visiblePages.push(i); // Zeige die ersten 5 Seiten
                    }
                    if (totalPages > 5) {
                        visiblePages.push("..."); // Platzhalter zu den restlichen Seiten
                        visiblePages.push(totalPages); // Zeige die letzte Seite
                    }
                }
                // Fall 2: Aktuelle Seite ist in den letzten 4 Seiten
                else if (currentPage >= totalPages - 3) {
                    visiblePages.push(1); // Zeige die erste Seite
                    if (totalPages > 5) {
                        visiblePages.push("..."); // Platzhalter zu den vorherigen Seiten
                    }
                    for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
                        visiblePages.push(i); // Zeige die letzten 5 Seiten
                    }
                }
                // Fall 3: Aktuelle Seite ist irgendwo in der Mitte
                else {
                    visiblePages.push(1); // Zeige die erste Seite
                    visiblePages.push("..."); // Platzhalter zu den vorherigen Seiten
                    visiblePages.push(currentPage - 1); // Eine Seite links von der aktuellen
                    visiblePages.push(currentPage); // Die aktuelle Seite
                    visiblePages.push(currentPage + 1); // Eine Seite rechts von der aktuellen
                    visiblePages.push("..."); // Platzhalter zu den nächsten Seiten
                    visiblePages.push(totalPages); // Zeige die letzte Seite
                }

                return visiblePages;
            },
            executeFunction(functionOrName, ...args) {
                if (!functionOrName) {
                    console.error('Kein Funktionsname oder Funktionsreferenz übergeben!');
                    return undefined;
                }

                let func;

                // 1. Direkte Funktionsreferenz: Überprüfen, ob ein Funktionsobjekt übergeben wurde
                if (typeof functionOrName === 'function') {
                    func = functionOrName;
                }

                // 2. Funktionsname im String-Format: Prüfen im globalen Kontext (`window`)
                else if (typeof functionOrName === 'string') {
                    // a. Versuche, die Funktion direkt über ihren Namen im globalen Kontext zu finden
                    if (typeof window !== 'undefined' && typeof window[functionOrName] === 'function') {
                        func = window[functionOrName];
                    } else {
                        console.error(`Die Funktion "${functionOrName}" konnte nicht im globalen Kontext gefunden werden.`);
                        return undefined;
                    }
                }

                // 3. Wenn keine Funktion gefunden wurde, Fehler zurückgeben
                if (!func) {
                    console.error(`Ungültige Funktion oder Name: "${functionOrName}"`);
                    return undefined;
                }

                // 4. Die Funktion sicher ausführen und die Rückgabe ausdrücken
                return func(...args);
            },
            isValueEmpty(value) {
                if (value === null || value === undefined) {
                    return true; // Null or undefined
                }
                if (Array.isArray(value)) {
                    return value.length === 0; // Empty array
                }
                if (typeof value === 'string') {
                    return value.trim().length === 0; // Empty string (including only spaces)
                }
                return false; // All other values are considered non-empty (including numbers)
            }
        }
    };
    /* jshint unused:true */

    const namespace = '.bs.table';

    const bsTableClasses = {
        wrapper: 'bs-table', // Overall wrapper class
        wrapperResponsive: 'bs-table-responsive', // Responsive wrapper variant
        overlay: 'bs-table-overlay', // For the visual loading overlay/spinner
        topContainer: 'bs-table-top-container', // The container above the table
        bottomContainer: 'bs-table-bottom-container', // The container below the table
        search: 'bs-table-search', // Wrapper for the search field
        searchInput: 'bs-table-search-input', // The search input field
        buttons: 'bs-table-buttons', // Container for the buttons in the top container
        btnRefresh: 'bs-table-btn-refresh', // Refresh button
        btnToggle: 'bs-table-btn-toggle-view', // Button to toggle table view
        btnCustomView: 'bs-table-btn-custom-view', // Button for the custom view mode
        toolbar: 'bs-table-toolbar', // Toolbar container
        pagination: 'bs-table-pagination', // Wrapper for the pagination controls
        paginationDetails: 'bs-table-pagination-details', // Wrapper for detailed pagination information
        checkLabelHeader: 'bs-table-check-label-header', // Checkbox label container in the table header
        checkInputHeader: 'bs-table-check-input-header', // Checkbox input in the table header
        checkInputBody: 'bs-table-check-input-body', // Checkbox input in the table body
    };

    const methods = {
        /**
         * Refreshes the table options and settings based on the provided configuration.
         *
         * @param {jQuery} $table The jQuery object is representing the table to be refreshed.
         * @param {Object} settings The new settings to be applied to the table.
         * @return {void} This method does not return a value.
         */
        refreshOptions($table, settings) {
            const setup = getSettings($table);
            const newSettings = $.extend(true, {}, setup, settings || {});
            const customView = newSettings.customView === true;
            const cardView = !customView && newSettings.cardView === true;
            setToggleCustomView($table, customView);
            setToggleView($table, cardView);
            setSettings($table, newSettings);
            // checkForCheckItems($table);
            refresh($table);
        },
        /**
         * Hides a specific row in the given table by its index.
         *
         * @param {jQuery} $table - The jQuery object representing the table containing the row to hide.
         * @param {number} rowIndex - The index of the row to hide, as identified by the `data-index` attribute.
         * @return {void} This method does not return a value.
         */
        hideRowByIndex($table, rowIndex) {
            $($table).children('tbody').children(`tr[data-index="${rowIndex}"]:not(.d-none)`).addClass('d-none');
        },
        /**
         * Retrieves the list of hidden columns for the provided table.
         *
         * @param {Object} $table - The table element or table configuration object.
         * @return {Array<string>} An array of field names representing the hidden columns.
         */
        getHiddenColumns($table) {
            const settings = getSettings($table);
            const hiddenColumns = [];
            settings.columns.forEach(column => {
                if (column.checkbox !== true && column.radio !== true) {
                    if (column.visible === false) {
                        hiddenColumns.push(column.field);
                    }
                }
            });
            return hiddenColumns;
        },
        /**
         * Retrieves the visible columns for the provided table.
         *
         * @param {Object} $table - The table element or reference for which visible columns need to be determined.
         * @return {Array<string>} A list of field names for the columns that are marked as visible and are neither checkboxes nor radio buttons.
         */
        getVisibleColumns($table) {
            const settings = getSettings($table);
            const visibleColumns = [];
            settings.columns.forEach(column => {
                if (column.checkbox !== true && column.radio !== true) {
                    if (column.visible === true) {
                        visibleColumns.push(column.field);
                    }
                }
            });
            return visibleColumns;
        },
        /**
         * Displays a row in the table that was previously hidden by removing the 'd-none' class.
         *
         * @param {jQuery} $table - A jQuery object representing the table element.
         * @param {number|string} rowIndex - The index of the row to show, which corresponds to the value of the 'data-index' attribute.
         * @return {void} This method does not return a value.
         */
        showRowByIndex($table, rowIndex) {
            $($table).children('tbody').children(`tr[data-index="${rowIndex}"].d-none`).removeClass('d-none');
        },
        /**
         * Retrieves the current scroll position of the specified table's wrapper element.
         *
         * @param {jQuery} $table - A jQuery-wrapped table element whose scroll position is to be determined.
         * @return {Object} An object containing the x and y scroll positions.
         *                  - x {number}: The horizontal scroll position.
         *                  - y {number}: The vertical scroll position.
         */
        getScrollPosition($table) {
            const $wrapper = getResponsiveWrapper($table);
            return {
                x: $($wrapper).scrollLeft(), y: $($wrapper).scrollTop()
            };
        },
        /**
         * Displays a loading overlay over the specified table element.
         *
         * @param {HTMLElement|jQuery} $table - The table element over which the loading overlay should be displayed.
         * @return {void} This method does not return any value.
         */
        showLoading($table) {
            const wrapper = getWrapper($table);
            // Vorhandenes Overlay entfernen, falls vorhanden
            this.hideLoading($table);

            // Overlay generieren
            const $overlay = $('<div>', {
                class: bsTableClasses.overlay + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-body',
                css: {
                    zIndex: 4, opacity: 0 // Das Overlay startet unsichtbar
                }
            }).appendTo(wrapper);

            // Placeholder-Struktur erstellen (Inhalt des Overlays)
            $('<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">' + '<span class="visually-hidden">Loading...</span>' + '</div>').appendTo($overlay);

            // Sanftes Einblenden mit animate
            $overlay.animate({opacity: 0.75}, 100); // Dauer: 300ms
        },
        /**
         * Hides the loading overlay for the specified table element.
         * Stops any ongoing animation on the overlay and animates its opacity to 0 before removing it from the DOM.
         *
         * @param {jQuery} $table - The jQuery object representing the table element for which the loading overlay should be hidden.
         * @return {void} This method does not return a value.
         */
        hideLoading($table) {
            const $overlay = $(getOverlay($table));
            if (!$overlay.length) {
                return;
            } // Abbruch, falls kein Overlay vorhanden ist

            // Vorherige Animation stoppen und sanftes Ausblenden starten
            $overlay.stop().animate({opacity: 0}, 100, function () {
                // Nach dem Ausblenden das Overlay vollständig entfernen
                $(this).remove();
            });
        }
    }

    /**
     * Initializes a table with the given settings or method, ensuring proper configuration
     * for options, columns, and height.
     * If the table has already been initialized,
     * it updates the options if provided.
     *
     * @param {jQuery} $table - The jQuery table element to be initialized.
     * @param {Object|string} optionsOrMethod - The configuration options for the table
     *                                           or the method to invoke on the table.
     * @return {void} This method does not return anything.
     * It sets up the table
     *                element, configures its settings, and manages its initialization state.
     */
    function initTable($table, optionsOrMethod) {

        // Check if the table is already initialized
        if ($($table).data('bsTable')) {
            // If the table has already been initialized and settings have been passed anyway,
            // refresh the settings
            if (typeof optionsOrMethod === 'object') {
                methods.refreshOptions($table, optionsOrMethod);
            }
            return;
        }
        // If global events have not been initialized, do so once
        if (!$.bsTable.globalEventsBound) {
            registerGlobalTableEvents(); // Globale Initialisierung binden (nur einmalig)
        }
        const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
        const settings = $.extend(true, {}, $.bsTable.getDefaults(), $($table).data() || {}, options || {});

        // Make sure that all columns are fully populated
        const columns = [];
        if (settings.columns && Array.isArray(settings.columns)) {
            settings.columns.forEach(column => {
                if (typeof column === 'object') {
                    columns.push($.extend(true, {}, $.bsTable.columnDefaults, column || {}));
                }
            })
        }

        // refresh the columns
        settings.columns = columns;

        // handle table height
        const height = settings.height || $($table).data('height') || parseInt($($table).css('height'), 10);
        if (!isNaN(height) && height !== 0) {
            settings.height = height; // Apply a valid amount
        } else {
            settings.height = undefined; // Ignore invalid values (NaN, 0)
        }

        const bsTable = {
            settings: settings,
            toggleView: settings.cardView === true,
            toggleCustomView: settings.customView === true,
            checkItem: {
                show: false,
                type: undefined,
                field: settings.idField || undefined,
                name: settings.selectItemName || undefined
            },
            response: [],
            selected: []
        };

        // Initialize the table with data
        $($table).data('bsTable', bsTable);

        // Create Structure Elements of the Table
        build.structure($table);

        // Update table (e.g. load or render data)
        refresh($table);
    }

    /**
     * Updates check item settings for the given table instance based on its configuration.
     * This method determines whether to show check items (checkbox or radio buttons)
     * and their type by analyzing the table's settings and columns.
     *
     * @param {object} $table - The table instance to configure, typically represented as a jQuery object.
     * @return {void} Does not return a value but modifies the table's data properties based on the "checkItems" configuration.
     */
    function calculateCheckItem($table) {
        const settings = getSettings($table);
        const isCheckbox = settings.columns.some(column => column.checkbox === true);
        const isRadio = settings.columns.some(column => column.radio === true);

        const showCheckItem =
            settings.selectItemName && // idField is set
            settings.idField && // idField is set
            settings.columns.length && // Columns are defined
            (isCheckbox || isRadio) && // At least one column has a checkbox or radio
            settings.columns.some(column => column.field === settings.idField); // idField exists in the columns

        const data = $table.data('bsTable');
        const checkItem = {
            show: showCheckItem,
            type: showCheckItem ? (isCheckbox ? 'checkbox' : 'radio') : undefined,
            field: showCheckItem ? settings.idField : undefined,
            name: showCheckItem ? settings.selectItemName : undefined,
        };
        setCheckItem($table, checkItem);
    }

    $.fn.bsTable = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            return $(this); // No element selected
        }
        if ($(this).length > 1) {
            // If multiple tables are selected, apply the logic to each table individually
            return $(this).each(function () {
                return $(this).bsTable(optionsOrMethod, ...args);
            });
        }

        const $table = $(this);

        // Initialize Table (Synchronous)
        initTable($table, optionsOrMethod);

        // If a method is specified, we'll run it here
        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'getData' : {
                    return getResponse($table).rows;
                }
                case 'getSelections': {
                    return getSelected($table);
                }
                case 'getOptions': {
                    return getSettings($table);
                }
                case 'getScrollPosition': {
                    return methods.getScrollPosition($table);
                }
                case 'showLoading': {
                    methods.showLoading($table);
                    break;
                }
                case 'hideLoading': {
                    methods.hideLoading($table);
                    break;
                }
                case 'refresh': {
                    const arg = args.length ? args[0] : null;
                    refresh($table, arg);
                    break;
                }
                case 'refreshOptions': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object') {
                        methods.refreshOptions($table, arg);
                    } else {
                        console.warn('Invalid argument for refreshOptions: ', arg);
                    }
                    break;
                }
                case 'setCaption': {
                    const arg = args.length ? args[0] : null;
                    setCaption($table, arg);
                    break;
                }
                case 'hideRow': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object' && arg.hasOwnProperty('index')) {
                        methods.hideRowByIndex($table, arg.index);
                    } else {
                        console.warn('Invalid argument for hideRow: ', arg);
                    }
                    break;
                }
                case 'showRow': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object' && arg.hasOwnProperty('index')) {
                        methods.showRowByIndex($table, arg.index);
                    } else {
                        console.warn('Invalid argument for showRow: ', arg);
                    }
                    break;
                }
                case 'getHiddenColumns': {
                    return methods.getHiddenColumns($table);
                }
                case 'getVisibleColumns': {
                    return methods.getVisibleColumns($table);
                }
                case 'load': {
                    const arg = args.length ? args[0] : null;
                    if (Array.isArray(arg)) {
                        const settings = getSettings($table);
                        settings.data = arg;
                        setSettings($table, settings);
                        refresh($table, {pageNumber: 1});
                    } else {
                        console.warn('Invalid argument for load: ', arg);
                    }
                    break;
                }
                default: {
                    console.warn(`Unknown method: ${optionsOrMethod}`);
                    break;
                }
            }
        }

        return $table;
    };


    /**
     * Sets the caption of a given table element. Based on the input provided,
     * it updates the caption text and optionally applies classes or additional behavior.
     *
     * If the provided input is empty, the method removes the caption entirely.
     * The caption can be customized via a string or an object containing text and additional properties.
     *
     * @param {jQuery} $table - The table element (wrapped in jQuery) to which the caption should be applied.
     * @param {string|Object} stringOrObject - The caption content or configuration.
     *     If a string is provided, it sets the caption text.
     *     If an object is provided, it may contain the following properties:
     *       - text: {string} The text to be displayed in the caption.
     *       - onTop: {boolean} Whether to add the "caption-top" class to the caption for styling.
     * @return {void} Does not return a value. Applies changes directly to the DOM element.
     */
    function setCaption($table, stringOrObject) {
        const settings = getSettings($table);
        let caption = $($table).find('caption:first');
        const isEmpty = $.bsTable.utils.isValueEmpty(stringOrObject);
        if (isEmpty) {
            caption.remove();
            return;
        }
        const captionClasses = [];
        const isString = typeof stringOrObject === 'string';
        const isObject = typeof stringOrObject === 'object';
        const captionText = isString ? stringOrObject : (isObject && stringOrObject && 'text' in stringOrObject) ? stringOrObject.text : null;
        if (!caption.length) {
            caption = $('<caption>', {
                html: captionText,
            }).prependTo($table);
        } else {
            caption.html(captionText);
        }

        if (isObject) {
            if (stringOrObject.hasOwnProperty('onTop') && stringOrObject.onTop === true) {
                captionClasses.push('caption-top');
                caption.addClass('caption-top');
            }
        }

        if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('caption')) {

            caption.attr('class', '');

            settings.classes.caption.split(' ').forEach(className => {
                const classNameCheck = className.trim();
                if (!$.bsTable.utils.isValueEmpty(classNameCheck)) {
                    captionClasses.push(classNameCheck);
                }
            });

            caption.addClass(captionClasses.join(' '));
        }
    }

    /**
     * Refreshes the table data with updated settings, retrieves data from the server, and re-renders the table.
     * The method processes optional parameters for customization and executes related events after data loading.
     *
     * @param {jQuery} $table - The table element to be refreshed.
     * @param {object} [options=null] - Optional parameters for the refresh process. Possible keys include:
     * - `silent` (boolean): If true, suppresses the loading indicator.
     * - `pageNumber` (number): The page number to set for the data retrieval.
     * - `pageSize` (number): The number of records per page. A value of 0 renders all data on one page.
     * - `url` (string): The specific URL to be used for fetching new data.
     * @param {boolean} [triggerRefresh=false] - A flag indicating whether a refresh event should be explicitly triggered.
     * @return {void}
     */
    function refresh($table, options = null, triggerRefresh = false) {
        const settings = getSettings($table);
        let silent = false;
        let pageNumber = settings.pageNumber ?? 1;
        let pageSize = settings.pageSize ?? 10;
        let url = settings.url;
        let update = false;

        // Opt-Parameter verarbeiten
        if (options && typeof options === 'object') {
            if (options.silent) {
                silent = options.silent;
            }
            if (options.pageNumber) {
                pageNumber = Math.max(1, options.pageNumber);
                update = true;
            }
            if (options.pageSize) {
                pageSize = options.pageSize;
                update = true;
            }
            if (options.url) {
                url = options.url;
                update = true;
            }
        }

        // PageSize = 0 -> Alle Daten darstellen
        if (pageSize === 0) {
            pageNumber = 1; // Setze pageSize auf eine einzige Seite mit allen Daten
        }

        // Gesamteinstellungen aktualisieren
        if (update) {
            settings.url = url;
            settings.pageNumber = pageNumber;
            settings.pageSize = pageSize;
            setSettings($table, settings);
        }

        if (!silent) {
            methods.showLoading($table);
        }

        fetchData($table, triggerRefresh)
            .then(() => {
                triggerEvent($table, 'load-success', getResponse($table));
                $.bsTable.utils.executeFunction(settings.onLoadSuccess, getResponse($table));
                build.table($table);
            })
            .catch(error => {
                console.error("Fehler beim Abrufen der Daten:", error);
            })
            .finally(() => {
                methods.hideLoading($table);
            })
    }

    function toggleView($table) {
        setToggleView($table, !getToggleView($table));
        setToggleCustomView($table, false);
        build.table($table);
    }

    function toggleCustomView($table) {
        setToggleCustomView($table, !getToggleCustomView($table));
        setToggleView($table, false);
        build.table($table);
    }

    /**
     * Fetches data for a table, handling local or remote data sources,
     * sorting, pagination, and optional search functionality.
     *
     * @param {jQuery} $jqTable The jQuery object representing the table for which data is being fetched.
     * @param {boolean} [triggerRefresh=false] Indicates whether a "refresh" event should be triggered during data fetching.
     * @return {Promise} A promise that resolves when the data has been successfully fetched and processed,
     *                   or rejects if there is an error during the data fetching process.
     */
    function fetchData($jqTable, triggerRefresh = false) {
        const $table = $($jqTable);
        const settings = getSettings($table);
        if (settings.debug) {
            console.groupCollapsed("fetchData");
            console.log("Starte fetchData für Tabelle:", $table); // DEBUG
        }
        return new Promise((resolve, reject) => {
            if (settings.debug) {
                console.log("Einstellungen geladen:", settings); // DEBUG
            }
            if (!settings.url && !(settings.data && Array.isArray(settings.data))) {
                if (settings.debug) {
                    console.error("Fehler: Weder eine API-URL noch lokale Daten konfiguriert."); // DEBUG
                }
                reject(new Error("Neither a URL nor local data were provided."));
                return;
            }

            let params = {};

            if (settings.sortName && settings.sortOrder) {
                params.sort = settings.sortName;
                params.order = settings.sortOrder;
            }

            // handle limit and offset
            // check and adapt pagination
            const pageNumber = settings.pageNumber > 0 ? settings.pageNumber : 1;
            const pageSize = settings.pageSize ?? 10; // Set a standard value if pageSize is not defined

            if (pageSize === 0) {
                if (settings.debug) {
                    console.log("Besonderer Fall: pageSize = 0 (Alle Datensätze anzeigen).");
                }
                params.limit = null; // no limitation
                params.offset = 0;   // no shift
            } else {
                const offset = (pageNumber - 1) * pageSize;
                params.limit = pageSize;
                params.offset = offset;
                if (settings.debug) {
                    console.log("Pagination-Parameter berechnet:", params); // DEBUG
                }
            }

            // Handle search
            // Suchkriterien verarbeiten
            const searchInput = $(getSearchInput($table));
            if (settings.search && searchInput.length) {
                const searchValue = searchInput.val()?.trim() || null;
                params.search = searchValue && !$.bsTable.utils.isValueEmpty(searchValue) ? searchValue : null;
                if (settings.debug) {
                    console.log("Suchkriterien verarbeitet:", params.search); // DEBUG
                }
            }

            // handle custom params
            // additional query parameters from the user
            if (typeof settings.queryParams === "function") {
                params = settings.queryParams(params);
                if (settings.debug) {
                    console.log("Zusätzliche Query-Parameter:", params); // DEBUG
                }
            }

            if (triggerRefresh) {
                triggerEvent($table, 'refresh', params);
                $.bsTable.utils.executeFunction(settings.onRefresh, params);
            }

            // Processing of local data
            if (Array.isArray(settings.data)) {

                if (settings.debug) {
                    console.log("Lokale Daten erkannt. Verarbeite lokale Daten...");
                }

                let filteredData = [...settings.data];

                if (params.sort && params.order) {
                    if (settings.debug) {
                        console.log(`Sortiere lokale Daten nach "${params.sort}" in Reihenfolge "${params.order}".`); // DEBUG
                    }

                    $.bsTable.utils.sortArrayByField(filteredData, params.sort, params.order);

                    if (settings.debug) {
                        console.log("Daten nach Sortierung:", filteredData); // DEBUG
                    }
                }

                // use search if relevant
                if (params.search) {
                    if (settings.debug) {
                        console.log("Suchfilter wird angewendet: ", params.search); // DEBUG
                    }
                    filteredData = filteredData.filter(row => Object.values(row).some(value => value && value.toString().toLowerCase().includes(params.search.toLowerCase())));
                    if (settings.debug) {
                        console.log(`Gefilterte Datenanzahl nach Suchkriterien (${params.search}):`, filteredData.length); // DEBUG
                    }
                }


                const totalRows = filteredData.length;

                if (pageSize === 0 || settings.pagination === false) {
                    // Alle Daten zurückgeben (kein Slice bei pageSize = 0)
                    if (settings.debug) {
                        console.log("Alle Daten für pageSize = 0 oder pagination = false zurückgeben:", totalRows, "Datensätze."); // DEBUG
                    }
                    const responseBefore = {rows: filteredData, total: totalRows};
                    const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                    setResponse($table, responseAfter ?? responseBefore);
                    if (settings.debug) {
                        console.groupEnd();
                    }
                    resolve();
                    return;
                }

                // Pagination-Parameter Berechnung
                const offset = params.offset || 0;
                const start = Math.min(totalRows, offset); // Start-Position
                const end = Math.min(totalRows, start + pageSize); // End-Position
                const rowsToRender = end - start;
                if (settings.debug) {
                    console.log(`Pagination-Details: Offset=${offset}, Start=${start}, End=${end}, Rows to Render=${rowsToRender}`); // DEBUG
                }

                if (rowsToRender <= 0) {
                    if (settings.debug) {
                        console.warn("Pagination-Ergebnis ist leer. Es gibt keine Daten für diese Seite."); // DEBUG
                    }
                    const responseBefore = {rows: [], total: totalRows};
                    const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                    setResponse($table, responseAfter ?? responseBefore);
                    if (settings.debug) {
                        console.groupEnd();
                    }
                    resolve();
                    return;
                }

                // Daten für die aktuelle Seite schneiden
                const slicedData = filteredData.slice(start, end);
                if (settings.debug) {
                    console.log("Daten für aktuelle Seite (Slice-Ergebnis):", slicedData); // DEBUG
                }

                const responseBefore = {rows: slicedData, total: totalRows};
                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                setResponse($table, responseAfter ?? responseBefore);
                if (settings.debug) {
                    console.groupEnd();
                }
                resolve();
                return;
            }

            if (settings.url) {
                if (settings.debug) {
                    console.log("Starte Datenabruf:", settings.url, "mit Parametern:", params); // DEBUG
                }

                if (typeof settings.url === "function") {
                    // `url` ist eine Funktion
                    settings.url(params)
                        .then(response => {
                            const processedResponse = Array.isArray(response) ? {
                                rows: response,
                                total: response.length
                            } : {...response, rows: response.rows || [], total: response.total || 0};

                            if (settings.debug) {
                                console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                            }

                            const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                            $table.data("response", responseAfter ?? processedResponse);
                            resolve();
                        })
                        .catch(error => {
                            if (settings.debug) {
                                console.error("Fehler bei der Verarbeitung der Funktion:", error); // DEBUG
                            }
                            reject(new Error(`Fehler bei der API-Abfrage (Funktion): ${error.message || error}`));
                        });
                } else if (typeof settings.url === "string") {
                    const urlFunction = window[settings.url]; // Prüfen, ob der String ein Funktionsname ist
                    if (typeof urlFunction === "function") {
                        // `url`-String repräsentiert eine Funktion
                        urlFunction(params)
                            .then(response => {
                                const processedResponse = Array.isArray(response) ? {
                                    rows: response,
                                    total: response.length
                                } : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                                $($table).data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .catch(error => {
                                if (settings.debug) {
                                    console.error("Error in functional URL processing:", error); // DEBUG
                                }
                                reject(new Error(`Error processing of the function: ${error.message || error}`));
                            });
                    } else {
                        // 'url' is an actual URL and not a function name
                        let defaultAjaxOptions = {
                            url: settings.url, method: "GET", data: params, dataType: "json"
                        };
                        const customAjaxOptions = $.bsTable.utils.executeFunction(settings.ajaxOptions, settings.url, params);
                        if (customAjaxOptions && typeof customAjaxOptions === 'object') {
                            defaultAjaxOptions = $.extend(true, {}, defaultAjaxOptions, customAjaxOptions || {});
                        }
                        const xhr = $($table).data('xhr') || null;
                        if (xhr !== null) {
                            xhr.abort();
                            $($table).removeData('xhr');
                        }
                        $table.data('xhr', $.ajax(defaultAjaxOptions)
                            .done(response => {
                                const processedResponse = Array.isArray(response) ? {
                                    rows: response,
                                    total: response.length
                                } : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von String-URL erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                                $table.data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .fail((xhr, status, error) => {
                                if (settings.debug) {
                                    console.error("Fehler bei der API-Abfrage (String-URL):", status, error); // DEBUG
                                }
                                reject(new Error(`Fehler bei der API-Abfrage (String-URL): ${status}, ${error}`));
                            })
                            .finally(() => {
                                $table.removeData('xhr');
                            }));
                    }
                }
            }
        });
    }

    const build = {
        structure($table) {
            $table.empty();
            const settings = getSettings($table);

            const wrapperId = getUniqueId();
            const $wrapper = $('<div>', {
                class: bsTableClasses.wrapper + ' position-relative', id: wrapperId,
            }).insertAfter($table);
            const $wrapperResponsive = $('<div>', {
                class: 'table-responsive ' + bsTableClasses.wrapperResponsive,
            }).appendTo($wrapper);

            const isChild = getClosestWrapper($wrapper).length > 0 ? 'true' : 'false';
            $wrapper.attr('data-child', isChild);
            $table.attr('data-wrapper', wrapperId);

            $table.appendTo($wrapperResponsive);
            setCaption($table, settings.caption);

            this.tableTopContainer($table);
            this.tableBottomContainer($table);

            $('<thead></thead>').appendTo($table);
            $('<tbody></tbody>').appendTo($table);
            $('<tfoot></tfoot>').appendTo($table);
        },
        dropdownPageList($table) {
            const settings = getSettings($table);
            const response = getResponse($table);
            const totalRows = response.total || (response.rows ? response.rows.length : 0);
            // Berechnung der Anzeige-Daten (Start- und Endzeilen)
            const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
            // const currentPage = settings.pageNumber || 1;
            const smallBtn = $table.hasClass('table-sm') ? 'btn-sm' : '';

            // Haupt-Wrapper (d-flex für Flexbox)
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group', 'data-role': 'tablePaginationPageSize'
            });
            // Dropdown für die Zeilenanzahl pro Seite
            const $dropdownToggle = $('<button>', {
                'class': `btn ${smallBtn} btn-secondary dropdown-toggle`,
                'type': 'button',
                'id': 'dropdownPaginationPageSize',
                'data-bs-toggle': 'dropdown',
                'aria-expanded': 'false'
            }).html((pageSize === totalRows ? 'All' : pageSize));

            const $dropdownMenu = $('<ul>', {
                'css': {
                    zIndex: 1021 // over sticky header
                },
                'class': 'dropdown-menu dropdown-menu-end  bg-gradient ',
                'aria-labelledby': 'dropdownPaginationPageSize'
            });

            // Dropdown-Optionen hinzufügen
            settings.pageList
                .filter(page => page === 'All' || page < totalRows)
                .forEach(page => {
                    const value = page === 'All' ? 0 : page;
                    const isAll = value === 0;
                    const isActive = (isAll && pageSize === 0) || page === pageSize;
                    const text = isAll ? 'All' : page;
                    const $dropdownItem = $('<li>').append($('<a>', {
                        class: `dropdown-item ${isActive ? 'active' : ''}`, href: '#', 'data-page': value
                    }).text(text));
                    $dropdownMenu.append($dropdownItem);
                });

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        }, dropdownColumns($table, smallBtnClass) {
            const settings = getSettings($table);

            if (!settings.columns || !settings.columns.length) {
                return null; // Keine Spalten vorhanden
            }

            const disabledClass = getToggleCustomView($table) ? 'disabled' : '';

            // Haupt-Wrapper des Dropdowns
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group', 'data-role': 'tableColumnVisibility'
            });

            // Dropdown-Toggle-Button
            const $dropdownToggle = $('<button>', {
                'class': `btn btn-secondary dropdown-toggle ${smallBtnClass} $(disabledClass)`,
                'type': 'button',
                'id': 'dropdownColumnVisibility',
                'data-bs-toggle': 'dropdown',
                'data-bs-auto-close': "outside",
                'aria-expanded': 'false'
            }).html('<i class="bi bi-layout-three-columns"></i>');

            // Dropdown-Menü
            const $dropdownMenu = $('<div>', {
                'css': {
                    zIndex: 1021 // over sticky header
                }, 'class': 'dropdown-menu bg-gradient dropdown-menu-end', 'aria-labelledby': 'dropdownColumnVisibility'
            });

            let colIndex = 0;

            // Zähler für sichtbare Spalten
            let checkedColumnsCount = settings.columns.filter(column => column.visible !== false).length;

            /**
             * Updates the states of checkboxes based on the configuration and current selection.
             * Enables or disables checkboxes to ensure that a minimum number of checkboxes remain selected.
             * Any unchecked checkboxes are always enabled.
             *
             * @return {void} Does not return a value.
             */
            function updateCheckboxStates() {
                const checked = $dropdownMenu.find('input[type="checkbox"]:checked'); // Alle aktivierten Checkboxen
                const notChecked = $dropdownMenu.find('input[type="checkbox"]:not(:checked)'); // Alle deaktivierten Checkboxen

                // If the number of checked checkboxes is <= minimum countColumns, deactivate the checked checkboxes
                if (checked.length <= settings.minimumCountColumns) {
                    checked.prop('disabled', true); // Deactivate checked checkboxes
                } else {
                    checked.prop('disabled', false);// Activate checked checkboxes when a limit is not reached
                }

                // non-checked checkboxes always remain active (disable = false)
                notChecked.prop('disabled', false);
            }

            // Add a checkbox for each column
            settings.columns.forEach((column) => {
                const isVisible = column.visible !== false;

                // Überspringen von Spalten mit `checkbox` oder `radio`
                if (column.checkbox || column.radio) {
                    return;
                }
                const uniqueId = getUniqueId('bs_table_column_visibility_');
                // Erstelle ein Menü-Item mit Checkbox
                const $menuItem = $('<div>', {'class': 'dropdown-item px-3'}).append($('<div>', {'class': 'form-check d-flex align-items-center'}).append($('<input>', {
                    'class': 'form-check-input me-2', // Abstand zur Checkbox hinzufügen
                    'type': 'checkbox', 'id': `${uniqueId}`, 'data-column-index': colIndex, 'checked': isVisible
                }).on('change' + namespace, function (e) {
                    const $checkbox = $(e.currentTarget);
                    const columnIndex = $checkbox.data('column-index');
                    const isChecked = $checkbox.is(':checked');

                    // Sichtbarkeitsstatus ändern
                    settings.columns[columnIndex].visible = isChecked;
                    setSettings($table, settings);
                    toggleColumnVisibility($table, columnIndex, isChecked);

                    // Sichtbare Spalten anpassen
                    checkedColumnsCount += isChecked ? 1 : -1;

                    // Checkbox-Zustände aktualisieren
                    updateCheckboxStates();
                }), $('<label>', {
                    'class': 'form-check-label mb-0', 'for': `${uniqueId}`
                })
                    .text(column.title || column.field || `Column ${colIndex + 1}`)
                    .on('click' + namespace, function (e) {
                        e.preventDefault(); // Verhindert das Schließen des Dropdowns
                        const label = $(e.currentTarget);
                        const $checkbox = $(`#${label.attr('for')}`); // Checkbox anhand der ID finden
                        $checkbox.prop('checked', !$checkbox.is(':checked')).trigger('change' + namespace); // Checkbox toggeln und Change-Event auslösen
                    })));

                $dropdownMenu.append($menuItem);
                colIndex++;
            });

            // Initiale Deaktivierungsprüfung
            updateCheckboxStates();

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        }, buttons($table) {
            const $wrapper = $(getWrapper($table));
            const settings = getSettings($table);
            const $btnContainer = $wrapper.find(`.${bsTableClasses.buttons}:first`).empty();
            const smallBtnClass = $table.hasClass('table-sm') ? 'btn-sm' : '';

            if (settings.showRefresh === true) {
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnRefresh} ${smallBtnClass}`,
                    html: `<i class="${settings.icons.refresh}"></i>`,
                }).appendTo($btnContainer);
            }

            if (settings.showToggle === true) {
                const toggleIcon = getToggleView($table) ? settings.icons.toggleOn : settings.icons.toggleOff;
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnToggle} ${smallBtnClass}`,
                    html: `<i class="${toggleIcon}"></i>`,
                }).prependTo($btnContainer);
            }
            if (settings.showCustomView === true) {
                const toggleIcon = getToggleCustomView($table) ? settings.icons.customViewOn : settings.icons.customViewOff;
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnCustomView} ${smallBtnClass}`,
                    html: `<i class="${toggleIcon}"></i>`,
                }).prependTo($btnContainer);
            }

            if (settings.showColumns === true) {
                this.dropdownColumns($table, smallBtnClass).prependTo($btnContainer);
            }
        }, tableTopContainer($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);

            let flexClass = 'flex-row';
            if (!['right', 'end'].includes(settings.paginationHAlign)) {
                flexClass += ' flex-row-reverse';
            }

            let gapClass = '';
            if ((settings.pagination === true && ['top', 'both'].includes(settings.paginationVAlign)) || settings.search === true || settings.toolbar || settings.showRefresh) {
                gapClass = 'gap-2 py-2';
            }

            const template = '' + '<div class="d-flex flex-column ' + gapClass + ' ' + bsTableClasses.topContainer + '">' + '<div class="d-flex justify-content-end align-items-end">' + '<div class="d-flex ' + bsTableClasses.toolbar + ' me-auto"></div>' + '<div class="d-flex ' + bsTableClasses.search + '"></div>' + '<div class="btn-group ' + bsTableClasses.buttons + '"></div>' + '</div>' + '<div class="d-flex justify-content-between align-items-end ' + flexClass + '">' + '<div class="' + bsTableClasses.paginationDetails + '"></div>' + '<div class="' + bsTableClasses.pagination + ' top"></div>' + '</div>' + '</div>';

            // top container consisting of 1-n lines
            const $tableTopContainer = $(template).prependTo($wrapper);
            const $toolbarContainer = $tableTopContainer.find('.' + bsTableClasses.toolbar);
            const $searchWrapper = $tableTopContainer.find('.' + bsTableClasses.search);


            // If a toolbar element is defined, add it to the first line and
            // Put Margin End on the car so that it is centered on the left
            if (settings.toolbar && $(settings.toolbar).length > 0) {
                $(settings.toolbar).prependTo($toolbarContainer);
            }

            // Create a search wrapper (left)
            // If the search is activated, add an input field and logic
            if (settings.search === true) {
                const placeholder = $.bsTable.utils.executeFunction(settings.formatSearch)
                const $searchInputGroup = $(`<div class="input-group">` + '<span class="input-group-text">' + '<i class="' + settings.icons.search + '"></i>' + '</span>' + '<input type="search" class="form-control ' + bsTableClasses.searchInput + '" placeholder="' + placeholder + '">' + '</div>');
                $searchInputGroup.appendTo($searchWrapper);
            }


            this.buttons($table);
        }, tableBottomContainer($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);

            let flexClass = 'flex-row';
            if (!['right', 'end'].includes(settings.paginationHAlign)) {
                flexClass += ' flex-row-reverse';
            }

            let gapClass = '';
            if ((settings.pagination === true && ['bottom', 'both'].includes(settings.paginationVAlign))) {
                gapClass = 'gap-2 py-2';
            }

            const template = '' + '<div class="d-flex flex-column ' + gapClass + ' ' + bsTableClasses.bottomContainer + '">' + '<div class="d-flex justify-content-between align-items-start ' + flexClass + '">' + '<div class="' + bsTableClasses.paginationDetails + '"></div>' + '<div class="' + bsTableClasses.pagination + ' bottom"></div>' + '</div>' + '</div>';
            $(template).appendTo($wrapper);
        }, pagination($table, totalRows) {
            // Retrieve table-specific settings for pagination (e.g. page number, page size).
            const settings = getSettings($table);

            // Compute the total number of pages based on the total number of rows and page size.
            const totalPages = Math.ceil(totalRows / settings.pageSize);

            // Determine the current page number (default to 1 if not defined).
            const currentPage = settings.pageNumber || 1;

            // Create a wrapper for the pagination navigation element (using a 'nav' element).
            const $paginationWrapper = $('<nav>', {'data-role': 'tablePagination'});

            const small = $table.hasClass('table-sm');
            // Create an unordered list for pagination links and append it to the wrapper.
            const $paginationList = $('<ul>', {
                class: 'pagination justify-content-center m-0' // Apply Bootstrap styles for centering and margin.
            }).appendTo($paginationWrapper);
            if (small) {
                $paginationList.addClass('pagination-sm');
            }


            /**
             * Helper function to create a pagination item (e.g. page links, "previous", "next").
             * @param {string|null} role - The role of the element (e.g., 'previous', 'next', or null for page numbers).
             * @param {boolean} disabled - Determines whether the item is disabled.
             * @param {boolean} active - Determines whether the item is the active page.
             * @param {string|number} content - The content to display in the pagination link (e.g., a number or HTML).
             */
            const createPageItem = (role, disabled, active, content) => {
                // Create a list item with appropriate Bootstrap classes and append it to the pagination list.
                const $item = $('<li>', {
                    'data-role': role, // Optional role (e.g., 'previous', 'next').
                    class: `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}` // Apply classes for active/disabled.
                }).appendTo($paginationList);

                // Create the anchor element (link) inside the list item with necessary attributes/events.
                $('<a>', {
                    class: 'page-link', // Apply Bootstrap class to style the link.
                    href: '#', // Prevent actual navigation for the link.
                    tabindex: disabled ? '-1' : '', // Disable focus on the link if it's marked as disabled.
                    'aria-disabled': disabled ? 'true' : 'false', // Set the ARIA attribute for accessibility.
                    html: content // Set the content of the link (HTML or plain text).
                }).appendTo($item);
            };

            // Create the "Previous" button for pagination.
            createPageItem('previous', // Role for the "previous" button.
                currentPage === 1, // Disable if the current page is the first page.
                false, // The "previous" button is never active.
                `<i class="${settings.icons.paginationPrev}"></i>` // Use an icon for the button content.
            );

            // Calculate which page numbers to display as visible links.
            const visiblePages = $.bsTable.utils.calculateVisiblePagesOnNavigation(totalPages, currentPage);

            // Iterate through the calculated visible pages and create page items for each.
            visiblePages.forEach(page => {
                if (page === "...") {
                    // If the page is a placeholder (e.g., "..."), create a disabled page item.
                    createPageItem(null, true, false, '...');
                } else {
                    // Otherwise, create a page item with the specific page number.
                    createPageItem(null, // No specific role for individual page links.
                        false, // Page links are never disabled unless specified.
                        page === currentPage, // Mark as active if this is the current page.
                        page // Display the page number as the content.
                    );
                }
            });

            // Create the "Next" button for pagination.
            createPageItem('next', // Role for the "next" button.
                currentPage === totalPages, // Disable if the current page is the last page.
                false, // The "next" button is never active.
                `<i class="${settings.icons.paginationNext}"></i>` // Use an icon for the button content.
            );

            // Return the completed pagination wrapper to be inserted into the DOM.
            return $paginationWrapper;
        }, paginationDetails($table, totalRows) {
            const settings = getSettings($table);
            const wrapper = getClosestWrapper($table);

            // Paginierung prüfen und Berechnungen entsprechend anpassen
            const pageSize = settings.pagination === false ? totalRows : (settings.pageSize || totalRows);
            const currentPage = settings.pagination === false ? 1 : (settings.pageNumber || 1);

            // Berechnung der Anzeige-Daten (Start- und Endzeilen)
            const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const endRow = Math.min(totalRows, currentPage * pageSize);

            // Textanzeige: "Showing x to y of total rows"
            const text = $.bsTable.utils.executeFunction(settings.formatShowingRows, startRow, endRow, totalRows);
            const dropdown = build.dropdownPageList($table);
            const $paginationText = $('<div>', {
                class: 'd-flex align-items-center', html: `<div class="me-3">${text}</div>`,
            })
            dropdown.appendTo($paginationText);
            const records = $.bsTable.utils.executeFunction(settings.formatRecordsPerPage, pageSize);
            $('<div>', {class: 'ms-2', html: records}).appendTo($paginationText);

            const $allDestinations = wrapper.find('.' + bsTableClasses.paginationDetails);

            if ($allDestinations.length > 0) {
                const showOnTop = ['top', 'both'].includes(settings.paginationVAlign);
                const showOnBottom = ['bottom', 'both'].includes(settings.paginationVAlign);
                const $first = $allDestinations.first().empty();
                const $last = $allDestinations.last().empty();

                if (showOnTop) {
                    $paginationText.clone().appendTo($first);
                }
                if (showOnBottom) {
                    $paginationText.clone().appendTo($last);
                }
            }
        }, table($table) {
            calculateCheckItem($table);
            const checkItem = getCheckItem($table);
            const settings = getSettings($table);
            const selected = getSelected($table);
            if (settings.debug) {
                console.groupCollapsed("Render Table");
            }
            if (typeof settings.height !== undefined) {
                $(getResponsiveWrapper($table)).css('max-height', settings.height);
            }
            const wrapper = $(getClosestWrapper($table));
            const response = getResponse($table);
            if (settings.debug) {
                console.log("Response:", response);
            }
            const totalRows = response.total || (response.rows ? response.rows.length : 0);
            const pageSize = settings.pageSize;
            const pageNumber = settings.pageNumber;
            let currentPageData = response.rows;
            if (settings.debug) {
                console.log("Total Rows:", totalRows);
                console.log("Page Size:", pageSize);
                console.log("Page Number:", pageNumber);
                console.log("Rows to Render:", currentPageData.length, currentPageData);
                console.groupEnd();
            }

            if (settings.columns && Array.isArray(settings.columns) && settings.columns.length > 0) {
                this.thead($table);
                this.tbody($table, currentPageData);
                this.tfoot($table, currentPageData);
                if (checkItem.show) {
                    const elementsNotInPageData = selected.filter(item => {
                        return !currentPageData.some(row => row[checkItem.field] === item[checkItem.field]); // Vergleich basierend auf 'id' oder einem eindeutigen Attribut
                    });
                    wrapper.find('.bs-invisible-checked').remove();
                    elementsNotInPageData.forEach(row => {
                        const value = row[checkItem.field];
                        $('<input>', {
                            class: 'bs-invisible-checked',
                            type: 'hidden',
                            name: `${checkItem.name}[]`,
                            value: value,
                        }).appendTo(wrapper);
                    });
                }


            }

            $table.children('thead').find('.' + bsTableClasses.checkLabelHeader).text(selected.length);

            // Setze CSS-Klassen auf die Tabelle
            const tableClasses = [];
            if (typeof settings.classes === 'string') {
                settings.classes.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        tableClasses.push(className);
                    }
                });
            } else if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('table')) {
                settings.classes.table.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        tableClasses.push(className);
                    }
                });
            }
            if (!tableClasses.includes('table')) {
                tableClasses.push('table');
            }
            $table.removeClass();
            $table.addClass(tableClasses.join(' '));

            // update search-size
            const searchWrapper = wrapper.find('.' + bsTableClasses.search + ':first').find('.input-group');
            if (searchWrapper.length) {
                if ($table.hasClass('table-sm')) {
                    searchWrapper.addClass('input-group-sm');
                } else {
                    searchWrapper.removeClass('input-group-sm');
                }
            }

            build.buttons($table);
            const $topPaginationContainer = $(getPaginationContainer($table, true)).empty();
            const $bottomPaginationContainer = $(getPaginationContainer($table, false)).empty();

            const $tableTopContainer = $(getTableTopContainer($table));
            const $btnContainer = $tableTopContainer.find(`.${bsTableClasses.buttons}:first`);


            if ($btnContainer.find('.btn').length && settings.search === true) {
                // we have buttons and a search field, pack Margin
                $btnContainer.addClass('ms-2');
            } else {
                // otherwise remove the margin
                $btnContainer.removeClass('ms-2');
            }

            if (settings.pagination) {
                this.paginationDetails($table, totalRows);
                const $paginationHtml = this.pagination($table, totalRows);
                const showOnTop = ['top', 'both'].includes(settings.paginationVAlign);
                const showOnBottom = ['bottom', 'both'].includes(settings.paginationVAlign);
                if (showOnTop) {
                    $topPaginationContainer.append($paginationHtml.clone());
                }
                if (showOnBottom) {
                    $bottomPaginationContainer.append($paginationHtml.clone());
                }
            }
        },
        thead($table) {
            const settings = getSettings($table);
            const columns = settings.columns || [];
            const showHeader = columns.length && settings.showHeader === true && !getToggleView($table) && !getToggleCustomView($table);
            const headerClasses = [];
            if (!showHeader) {
                headerClasses.push('d-none')
            }
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('thead')) {
                settings.classes.thead.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        headerClasses.push(className);
                    }
                });
            }
            if (typeof settings.height !== undefined) {
                headerClasses.push('sticky-top');
            }

            const $thead = $table.children('thead').empty().addClass(headerClasses.join(' '));
            if (showHeader) {
                $thead.removeClass('d-none');
            }
            const $tr = $('<tr></tr>').appendTo($thead);
            if (showHeader) {
                if (showCheckItem($table)) {
                    buildCheckboxOrRadio($table, $tr, null);
                }
                let colIndex = 0;
                columns.forEach(column => {
                    if (column.checkbox === true || column.radio === true) {
                        return;
                    }
                    this.theadTr(column, $tr, colIndex);
                    colIndex++;
                });

                triggerEvent($table, 'post-header', $thead, $table);
                $.bsTable.utils.executeFunction(settings.onPostHeader, $thead, $table);
            }
        }, theadTr(column, $tr, colIndex) {
            const $table = $tr.closest('table');
            const settings = getSettings($table);
            const isSortable = column.sortable === true;
            const order = column.field === settings.sortName ? settings.sortOrder ?? '' : '';

            // Create the <th> element
            const $th = $('<th>', {
                'data-sortable': isSortable ? 'true' : 'false',
                'data-field': column.field,
                'data-order': order,
                'data-col-index': colIndex
            }).appendTo($tr);

            // Build inner HTML
            if (isSortable) {
                // If sortable, create the inner structure manually
                const $container = $('<div>', {class: 'd-flex align-items-center justify-content-between'});
                const $title = $('<span>', {class: 'flex-fill me-1', text: column.title ?? ''});
                const $icon = $('<span>').append($('<i>', {
                    class: `bs-table-icon ${getIconBySortOrder($table, order)}`
                }));

                $container.append($title).append($icon);
                $th.append($container);

                // Add pointer cursor
                $th.css('cursor', 'pointer');
            } else {
                $th.text(column.title ?? '');
            }

            // Apply CSS and attributes
            if (column.width) {
                $th.css('width', column.width);
            }

            // Build class list
            const alignmentClasses = {
                end: 'text-end',
                right: 'text-end',
                start: 'text-start',
                left: 'text-start',
                center: 'text-center',
                middle: 'text-center'
            };

            const classList = [column.halign && alignmentClasses[column.halign] ? alignmentClasses[column.halign] : '', column.visible === false ? 'd-none' : ''].filter(Boolean);

            if (classList.length) {
                $th.addClass(classList.join(' '));
            }
        }, tbody($table, rows) {
            const settings = getSettings($table);
            triggerEvent($table, 'pre-body', rows, $table);
            $.bsTable.utils.executeFunction(settings.onPreBody, rows, $table);
            const hasColumns = settings.columns && settings.columns.length;
            const columns = hasColumns ? settings.columns : [];
            const $tbody = $table.children('tbody').empty();
            const inToggleView = getToggleView($table);
            const inToggleCustomView = getToggleCustomView($table);
            const hasResponse = rows && rows.length > 0;

            let bodyClasses = [];
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tbody')) {
                settings.classes.tbody.split(' ').forEach(className => {
                    const classNameTrimmed = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(classNameTrimmed)) {
                        bodyClasses.push(classNameTrimmed);
                    }
                });
            }

            $tbody.addClass(bodyClasses.join(' '));

            if (!hasResponse) {
                const $tr = $('<tr></tr>').appendTo($tbody);
                $('<td>', {
                    colspan: getCountColumns($table), class: 'text-center', html: settings.formatNoMatches(),
                }).appendTo($tr);
            } else if (inToggleCustomView) {
                const $tr = $('<tr></tr>').appendTo($tbody);
                const $td = $('<td>', {
                    colspan: getCountColumns($table),
                }).appendTo($tr);
                triggerEvent($table, 'custom-view', rows, $td);
                $.bsTable.utils.executeFunction(settings.onCustomView, rows, $td);
            } else {
                let trIndex = 0;
                rows.forEach(row => {
                    const $tr = $('<tr>', {
                        'data-index': trIndex,
                    }).appendTo($tbody);
                    if (getToggleView($table)) {
                        $tr.addClass('d-flex flex-column');
                    }
                    $tr.data('row', row);
                    $.bsTable.utils.executeFunction(settings.rowStyle, row, trIndex, $tr);
                    if (hasColumns) {
                        if (showCheckItem($table)) {
                            buildCheckboxOrRadio($table, $tr, row);
                        }
                        let colIndex = 0;
                        settings.columns.forEach(column => {
                            if (column.checkbox === true || column.radio === true) {
                                return;
                            }
                            this.tbodyTd(column, row, $tr, colIndex, inToggleView);
                            colIndex++;
                        });
                    }
                    trIndex++;
                })
            }

            const tableResponsive = $(getResponsiveWrapper($table));

            if (tableResponsive.length) {
                tableResponsive.scrollTop(0);
            }

            // Nur die Daten der aktuellen Seite an onPostBody übergeben
            triggerEvent($table, 'post-body', rows, $table);
            $.bsTable.utils.executeFunction(settings.onPostBody, rows, $table);
        },
        tbodyTd(column, row, $tr, colIndex, inToggleView) {
            if (column.field) {
                const trIndex = $tr.data('index');
                let classList = [];
                if (column.class) {
                    column.class.split(' ').forEach(className => {
                        classList.push(className);
                    });
                }
                if (column.align) {
                    let align = null;
                    if (['end', 'right'].includes(column.align)) {
                        align = 'end';
                    }
                    if (['start', 'left'].includes(column.align)) {
                        align = 'start';
                    }
                    if (['center', 'middle'].includes(column.align)) {
                        align = 'center';
                    }
                    if (null !== align) {
                        classList.push('text-' + align);
                    }
                }
                if (column.valign) {
                    classList.push('align-' + column.valign);
                }


                // Erstelle die `td`-Zelle mit Klassen und Wert
                const $td = $('<td>', {
                    'data-col-index': colIndex, class: classList.join(' '),
                }).appendTo($tr);

                if (inToggleView) {
                    $td.css('width', '100%');
                } else if (column.width) {
                    $td.css('width', column.width);
                }

                if (column.visible === false) {
                    $td.addClass('d-none');
                }

                $td.data('column', column);
                // $td.data('row', row);
                $td.data('trIndex', trIndex);

                let value = row[column.field] ?? ' - ';
                const valueFormatter = $.bsTable.utils.executeFunction(column.formatter, value, row, trIndex, $td);
                if (!$.bsTable.utils.isValueEmpty(valueFormatter)) {
                    value = valueFormatter;
                }

                // Setze den Wert auf die Zelle nur, wenn die Zelle vorher leer war
                if ($td.html().trim() === '') {
                    $td.html(value);
                }

                // When `Events` is defined, register it for the cell
                if (column.events) {
                    for (let [eventSelector, eventHandler] of Object.entries(column.events)) {
                        (function (eventSelector, eventHandler, columnFieldValue, rowData) {
                            const splitEvent = eventSelector.split(' '); // parts according to spaces
                            const selector = splitEvent.pop(); // The last element is the selector (e.g. "Span")
                            const eventTypes = splitEvent.join(' '); // Everything except the selector event types

                            if (selector) {
                                $td.on(eventTypes, selector, function (e) {
                                    eventHandler(e, columnFieldValue, rowData, trIndex);
                                });
                            } else {
                                $td.on(eventTypes, function (e) {
                                    eventHandler(e, columnFieldValue, rowData, trIndex);
                                });
                            }
                        })(eventSelector, eventHandler, row[column.field] ?? null, row);
                    }
                }
            }
        },
        tfoot($table, data) {
            const settings = getSettings($table);
            const columns = settings.columns || [];
            const showFooter = columns.length && settings.showFooter === true && !getToggleView($table) && !getToggleCustomView($table);

            const footerClasses = [];
            if (!showFooter) {
                footerClasses.push('d-none')
            }
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tfoot')) {
                settings.classes.tfoot.split(' ').forEach(className => {
                    const classNameTrimmed = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(classNameTrimmed)) {
                        footerClasses.push(classNameTrimmed);
                    }
                })
            }

            if (typeof settings.height !== undefined) {
                footerClasses.push('sticky-bottom');
            }

            const $tfoot = $table.children('tfoot').empty().addClass(footerClasses.join(' '));

            if (showFooter) {
                $tfoot.removeClass('d-none');
            }

            const $tr = $('<tr></tr>').appendTo($tfoot);

            if (showFooter) {
                if (showCheckItem($table)) {
                    $('<th></th>').appendTo($tr);
                }

                let colIndex = 0;
                columns.forEach(column => {
                    if (column.checkbox === true || column.radio === true) {
                        return;
                    }
                    this.tfootTr(column, $tr, colIndex, data);
                    colIndex++;
                })

                // Nur die Daten der aktuellen Seite an onPostFooter übergeben
                triggerEvent($table, 'post-footer', $tfoot, $table);
                $.bsTable.utils.executeFunction(settings.onPostFooter, $tfoot, $table);
            }
        }, tfootTr(column, $tr, colIndex, data) {
            // Formatierer-Wert prüfen und zuweisen
            const formatterValue = $.bsTable.utils.executeFunction(column.footerFormatter, data);
            const value = !$.bsTable.utils.isValueEmpty(formatterValue) ? formatterValue : '';

            // <th>-Element erstellen
            const $th = $('<th>', {
                html: value, 'data-col-index': colIndex
            }).appendTo($tr);

            // Assignment of Alignment Classes
            const alignmentClasses = {
                end: 'text-end',
                right: 'text-end',
                start: 'text-start',
                left: 'text-start',
                center: 'text-center',
                middle: 'text-center'
            };

            // Creating Classes
            const classList = [column.falign && alignmentClasses[column.falign] ? alignmentClasses[column.falign] : '', column.visible === false ? 'd-none' : ''].filter(Boolean);

            // Apply classes, if available
            if (classList.length) {
                $th.addClass(classList.join(' '));
            }
        }
    };


    function toggleColumnVisibility($table, colIndex, isVisible) {
        // Selektiert die `th`-Elemente im Header, basierend auf colIndex
        const $theadThs = $table.children('thead').children('tr').children(`th[data-col-index="${colIndex}"]`);

        // Selektiert die `td`-Zellen im Body, basierend auf colIndex
        const $tbodyTds = $table.children('tbody').children('tr').children(`td[data-col-index="${colIndex}"]`);

        // Selektiert die Zellen im Footer, basierend auf colIndex
        const $tfootCells = $table.children('tfoot').children('tr').children(`[data-col-index="${colIndex}"]`);

        // Sichtbarkeit aktualisieren: d-none hinzufügen oder entfernen
        if (isVisible) {
            $theadThs.removeClass('d-none');
            $tbodyTds.removeClass('d-none');
            $tfootCells.removeClass('d-none');
        } else {
            $theadThs.addClass('d-none');
            $tbodyTds.addClass('d-none');
            $tfootCells.addClass('d-none');
        }
    }

    function getIconBySortOrder($table, sortOrder) {
        const {icons} = getSettings($table);
        const iconMap = {
            asc: icons.sortAsc, desc: icons.sortDesc, default: icons.sortNone
        };
        return iconMap[sortOrder] || iconMap.default;
    }

    function buildCheckboxOrRadio($table, $tr, row = null) {
        const settings = getSettings($table);
        const selected = getSelected($table);
        const forHeader = $.bsTable.utils.isValueEmpty(row);
        const checkItem = getCheckItem($table);


        const $thCheckbox = $(forHeader ? '<th></th>' : '<td></td>', {
            class: 'text-center align-middle', 'data-role': 'tableCellCheckbox',
        }).appendTo($tr);


        const inputType = getCheckItemType($table);
        const isCheckbox = inputType === 'checkbox';
        if (forHeader) {
            $thCheckbox.css('width', '50px');
        }

        const $thCheckboxWrapper = $('<div></div>', {
            class: 'form-check form-switch'
        }).appendTo($thCheckbox);

        const dataRoleClass = isCheckbox ? 'bs-table-checkbox' : 'bs-table-radio';

        const $thCheckboxInput = $('<input>', {
            id: getUniqueId(`bs_table_${inputType}_`),
            class: 'form-check-input float-none',
            type: inputType,
        }).appendTo($thCheckboxWrapper);
        $thCheckboxInput.addClass(dataRoleClass);

        if (forHeader) {
            $thCheckboxInput.addClass(bsTableClasses.checkInputHeader);
        } else {
            $thCheckboxInput.addClass(bsTableClasses.checkInputBody);
        }

        if (!isCheckbox && forHeader) {
            $thCheckboxInput.prop('disabled', true);
        }

        const $thCheckboxLabel = $('<label></label>', {
            class: 'form-check-label m-0',
            for: $thCheckboxInput.attr('id'),
            html: forHeader ? selected.length : '',
        }).appendTo($thCheckboxWrapper);

        if (!forHeader) {
            $thCheckboxLabel.addClass('d-none');
        } else {
            $thCheckboxLabel.addClass('ms-2');
            $thCheckboxLabel.addClass(bsTableClasses.checkLabelHeader);
        }

        // add specific attributes when there are line data
        if (!forHeader) {
            const field = checkItem.field;
            const rowValue = row[field] ?? null;

            $thCheckboxInput.attr('value', row[field] ?? null);
            // behavior dependent on the type
            if (isCheckbox) {
                // For checkboxes, the name remains an array
                $thCheckboxInput.attr('name', `${checkItem.name}[]`);
            } else {
                // For radio buttons we remove the array suffix []
                $thCheckboxInput.attr('name', field);
            }

            // check whether the `Row` is in the` selected` list and mark the checkbox/radio button as "checked"
            const exists = selected.some(item => item[field] === rowValue);
            if (exists) {
                $thCheckboxInput.prop('checked', true); // Set "checked" if available
                let activeClassName = 'table-active'
                if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
                    activeClassName = settings.classes.active;
                }
                $tr.addClass(activeClassName);
            }

        }

        return true;
    }

    function getCountColumns($table, onlyVisible = true) {
        const settings = getSettings($table);

        if (!settings.columns || !settings.columns.length) {
            return 0; // Keine Spalten
        }

        // Filtert sichtbare Spalten, wenn onlyVisible true ist, sonst zählt alle.
        let columnCount = settings.columns.filter(column => !onlyVisible || column.visible !== false).length;

        // Prüft, ob mindestens eine Spalte checkbox: true oder radio: true ist.
        const hasCheckboxOrRadio = showCheckItem($table);

        // Wenn eine solche Spalte existiert, rechne 1 hinzu
        if (hasCheckboxOrRadio) {
            columnCount += 1;
        }

        return columnCount;
    }

    function getSettings($table) {
        return $table.data('bsTable').settings;
    }

    function setSettings($table, settings) {
        const data = $table.data('bsTable');
        if (data) {
            data.settings = settings;
        }
        $table.data('bsTable', data);
    }

    function getResponse($table) {
        return $table.data('bsTable').response || {rows: [], total: 0};
    }

    function showCheckItem($table) {
        return $table.data('bsTable').checkItem.show;
    }
    function getCheckItem($table) {
        return $table.data('bsTable').checkItem;
    }
    function setCheckItem($table, checkItem) {
        // Access the table's data
        const data = $table.data('bsTable');
        data.checkItem = checkItem;
        $table.data('bsTable', data);
    }

    function getCheckItemType($table) {
        return $table.data('bsTable').checkItem.type;
    }

    function getSelected($table) {
        return $table.data('bsTable').selected || []
    }

    function addSelected($table, selected) {
        // Access the table's data
        const data = $table.data('bsTable');
        const checkItem = data.checkItem;
        // Get the unique field identifier (e.g., idField)
        const idField =checkItem.field;

        if (data) {
            // Check if the selected item already exists in 'data.selected'
            const exists = data.selected.some(item => item[idField] === selected[idField]);

            // Add the item only if it doesn't exist
            if (!exists) {
                if (data.settings.debug) {
                    console.log('addSelected', selected);
                }
                data.selected.push(selected);
                if (data.settings.debug) {
                    console.log('newSelected', data.selected);
                }
            }
        }

        // Save the updated data back to the table
        $table.data('bsTable', data);
        $table.children('thead').find('.' + bsTableClasses.checkLabelHeader).text(data.selected.length);
    }

    function removeSelected($table, row) {
        // Retrieve the table's internal data
        const data = $table.data('bsTable');
        const checkItem = data.checkItem;
        const idField = checkItem.field; // The field used as a unique identifier

        if (data) {
            if (data.settings.debug) {
                console.log('removeSelected', row);
            }
            // Filter out the item that matches the given row's idField value
            data.selected = data.selected.filter(item => item[idField] !== row[idField]);
            if (data.settings.debug) {
                console.log('newSelected', data.selected);
            }
        }

        // Update the table's data
        $table.data('bsTable', data);
        $table.children('thead').find('.' + bsTableClasses.checkLabelHeader).text(data.selected.length);
    }

    function setSelected($table, rows) {
        const data = $table.data('bsTable');
        if (data) {
            data.selected = rows || [];
        }
        $table.data('bsTable', data);
        $table.children('thead').find('.' + bsTableClasses.checkLabelHeader).text(data.selected.length);
    }

    function setResponse($table, response) {
        const data = $table.data('bsTable');
        if (data) {
            data.response = response || {rows: [], total: 0};
        }
        $table.data('bsTable', data);
    }


    function getToggleView($table) {
        return $table.data('bsTable').toggleView;
    }

    function getToggleCustomView($table) {
        return $table.data('bsTable').toggleCustomView;
    }

    function setToggleCustomView($table, toggle) {
        const data = $table.data('bsTable');
        if (data) {
            data.toggleCustomView = toggle;
        }
        $table.data('bsTable', data);
    }

    function setToggleView($table, toggleView) {
        const data = $table.data('bsTable');
        if (data) {
            data.toggleView = toggleView;
        }
        $table.data('bsTable', data);
    }

    /**
     * Retrieves the closest wrapper element surrounding the specified table element.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {jQuery} A jQuery object representing the closest wrapper element.
     */
    function getWrapper($table) {
        return $($table).closest(`.${bsTableClasses.wrapper}`);
    }

    /**
     * Retrieves the closest parent element with the class `wrapperResponsive` for the specified table element.
     *
     * @param {jQuery} $table The jQuery object representing the table element for which the responsive wrapper is to be found.
     * @return {jQuery} A jQuery object representing the closest parent element with the `wrapperResponsive` class.
     */
    function getResponsiveWrapper($table) {
        return $($table).closest(`.${bsTableClasses.wrapperResponsive}`);
    }

    function getClosestWrapper($element) {
        return $($element).closest(`.${bsTableClasses.wrapper}`);
    }

    /**
     * Retrieves the bottom container element of the table within its wrapper.
     *
     * @param {jQuery} $table - The jQuery object of the table for which the bottom container is retrieved.
     * @return {jQuery} The jQuery object representing the bottom container element.
     */
    function getTableBottomContainer($table) {
        const $wrapper = $(getWrapper($table)); // Hole den aktuellen Plugin-Wrapper
        return $wrapper.children(`.${bsTableClasses.bottomContainer}`).first();
    }

    /**
     * Retrieves the top container element of a table within the provided wrapper.
     *
     * @param {jQuery} $table - The jQuery object representing the table for which the top container is to be obtained.
     * @return {jQuery} - A jQuery object representing the first top container element found within the wrapper.
     */
    function getTableTopContainer($table) {
        const $wrapper = $(getWrapper($table));
        return $wrapper.children(`.${bsTableClasses.topContainer}`).first();
    }

    /**
     * Retrieves the pagination container element within the specified table.
     *
     * @param {jQuery} $table - The jQuery object representing the target table.
     * @param {boolean} top - A boolean indicating whether to retrieve the top pagination container (true)
     *                        or the bottom pagination container (false).
     *
     * @return {jQuery} Returns the jQuery object representing the pagination container element.
     */
    function getPaginationContainer($table, top) {
        if (top) {
            return $(getTableTopContainer($table)).find('.' + bsTableClasses.pagination);
        } else {
            return $(getTableBottomContainer($table)).find('.' + bsTableClasses.pagination);
        }
    }


    /**
     * Retrieves the search input element is directly associated with the given table.
     *
     * @param {jQuery} $table - The jQuery-wrapped table element for which the search input is to be found.
     * @return {jQuery} - The jQuery-wrapped search input element if found, or an empty jQuery object if no associated input is found.
     */
    function getSearchInput($table) {
        const $wrapper = $(getWrapper($table)); // Hole den aktuellen Plugin-Wrapper

        // Finde den einzigen Such-Input im Wrapper, aber ignoriere Inputs aus untergeordneten Wrappers
        const $searchInput = $wrapper.find('.' + bsTableClasses.searchInput).filter(function () {
            // Stelle sicher, dass der Input direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur den ersten gefilterten Input holen (falls mehr als einer gefunden wird)

        return $searchInput.length > 0 ? $searchInput : $(); // Fallback: leeres jQuery-Objekt, falls nichts gefunden
    }

    /**
     * Generates a unique identifier string by appending a randomly generated portion to the given prefix.
     *
     * @param {string} [prefix="bs_table_wrapper_"] - The string to prepend to the generated unique ID.
     * @return {string} A unique identifier string prefixed with the provided or default prefix.
     */
    function getUniqueId(prefix = "bs_table_wrapper_") {
        const randomId = Math.random().toString(36).substring(2, 10);
        return prefix + randomId;
    }


    /**
     * Retrieves the overlay element associated with the provided table element.
     * This method ensures that only the overlay directly belonging to the current
     * wrapper of the table is returned, ignoring overlays in nested wrappers.
     *
     * @param {jQuery} $table - The jQuery object representing the table element for which the overlay is searched.
     * @return {jQuery} A jQuery object containing the overlay element, or an empty jQuery object if no overlay is found.
     */
    function getOverlay($table) {
        const $wrapper = $(getWrapper($table)); // get the current plugin wrapper

        // Find the overlay in the current wrapper, ignore overlays in nested wrappers
        const $overlay = $wrapper.find('.' + bsTableClasses.overlay).filter(function () {
            // check whether this overlay is located directly in the current wrapper
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // only get the first overlay (if several are found)

        return $overlay.length > 0 ? $overlay : $(); // Fallback: empty jQuery object if no overlay has been found
    }


    /**
     * Handles the sorting functionality for a table header (`<th>`).
     * Updates the sort state of the specified header and resets other sortable headers in the table.
     * Triggers the sorting event and refreshes the table with the new sort order and field.
     *
     * @param {jQuery} $thElement - The jQuery object representing the table header element (`<th>`) to sort on.
     * @return {void} This function does not return a value.
     */
    function handleSortOnTheadTh($thElement) {
        const $th = $($thElement);
        const wrapper = $(getClosestWrapper($th));
        const $table = $(getTableByWrapperId(wrapper.attr('id')));
        const settings = getSettings($table);
        const allSortableHeaders = $table.find('thead:first th[data-sortable="true"]')
        const filteredHeaders = allSortableHeaders.not($th);

        filteredHeaders.each(function (i, el) {
            const $otherTh = $(el);
            $otherTh.attr('data-order', '');
            const $icon = $otherTh.find('i.bs-table-icon');
            $icon.removeClass(settings.icons.sortNone);
            $icon.removeClass(settings.icons.sortAsc);
            $icon.removeClass(settings.icons.sortDesc);
            $icon.addClass(settings.icons.sortNone);
        });

        if ($th.length > 0) {
            let order = $th.attr('data-order');
            if (order === 'asc') {
                order = 'desc';
            } else if (order === 'desc') {
                order = '';
            } else {
                order = 'asc';
            }
            const $iconCurrent = $th.find('i.bs-table-icon');
            const field = $th.attr('data-field');
            $iconCurrent.removeClass(settings.icons.sortNone);
            $iconCurrent.removeClass(settings.icons.sortAsc);
            $iconCurrent.removeClass(settings.icons.sortDesc);
            $th.attr('data-order', order);
            settings.sortOrder = order === '' ? null : order;
            settings.sortName = field;
            settings.pageNumber = 1;

            switch (order) {
                case 'asc': {
                    $iconCurrent.addClass(settings.icons.sortAsc);
                }
                    break;
                case 'desc': {
                    $iconCurrent.addClass(settings.icons.sortDesc);
                }
                    break;
                default: {
                    $iconCurrent.addClass(settings.icons.sortNone);
                }
            }
        } else {
            settings.sortOrder = null;
            settings.sortName = null;
        }

        triggerEvent($table, 'sort', settings.sortName, settings.sortOrder);
        $.bsTable.utils.executeFunction(settings.onSort, settings.sortName, settings.sortOrder);
        setSettings($table, settings);
        refresh($table);
    }

    function onClickCellAndRow($td) {
        if ($td.attr('data-role') === 'tableCellCheckbox') {
            return;
        }
        const $table = $td.closest('table');
        const settings = getSettings($table);
        const column = $td.data('column');
        const $tr = $td.closest('tr');
        const row = $tr.data('row');
        const value = row[column.field] ?? null;
        triggerEvent($table, 'click-row', row, $tr, column.field)
        $.bsTable.utils.executeFunction(settings.onClickRow, row, $tr, column.field);
        triggerEvent($table, 'click-cell', column.field, value, row, $td);
        $.bsTable.utils.executeFunction(settings.onClickCell, column.field, value, row, $td);
        if (settings.clickToSelect === true) {
            if (showCheckItem($table)) {
                const checkbox = $tr.find('td[data-role="tableCellCheckbox"]:first input');
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change' + namespace);
            }
        }
    }

    function triggerEvent($table, eventName, ...args) {
        const targetTable = $table[0];
        const settings = getSettings($table);
        const isSubTable = $table.closest(`.${bsTableClasses.wrapper}[data-child="true"]`).length > 0;
        const hasSubTables = getClosestWrapper($table).find(`.${bsTableClasses.wrapper}[data-child="true"]`).length > 0;
        // Event-Namespace erweitern, wenn es sich um eine Subtable handelt

        const bsTableDatas = {
            table: targetTable, settings: settings, isChildTable: isSubTable, hasChildTables: hasSubTables,
        }

        const event = $.Event(eventName + namespace, {
            target: targetTable, bsTable: bsTableDatas,
        });

        $table.trigger(event, args);
        event.stopPropagation();

        if (eventName !== 'all') {
            const allEvent = $.Event(`all${namespace}`, {target: targetTable});
            $table.trigger(allEvent, [eventName + namespace, ...args]);
            allEvent.stopPropagation();
        }
    }


    /**
     * Retrieves a table element that has a specific data-wrapper attribute matching the provided wrapper ID.
     *
     * @param {string} wrapperId - The ID of the wrapper to search for in the data-wrapper attribute of the table.
     * @return {jQuery} A jQuery object representing the table element with the matching data-wrapper attribute.
     */
    function getTableByWrapperId(wrapperId) {
        return $(`table[data-wrapper="${wrapperId}"`);
    }

    function handleClickOnPaginationSize($table, $a) {
        const settings = getSettings($table);
        const response = getResponse($table);
        settings.pageSize = parseInt($a.data('page'));
        const totalRows = response.total;
        const maxPageNumber = Math.ceil(totalRows / settings.pageSize);

        if (settings.pageNumber > maxPageNumber) {
            console.warn(`Page ${settings.pageNumber} is invalid. Falling back to last page (${maxPageNumber}).`);
            settings.pageNumber = maxPageNumber;
        }

        setSettings($table, settings);
        refresh($table);
    }

    function handleCheckboxChange($checkbox) {
        if (!$checkbox.length) {
            return;
        }
        const $wrapper = $(getClosestWrapper($checkbox));
        const $table = $(getTableByWrapperId($wrapper.attr('id')));
        const $tr = $checkbox.closest('tr');
        const isChecked = $checkbox.is(':checked');
        const settings = getSettings($table);
        const row = $tr.data('row');
        if (isChecked) {
            addSelected($table, row);
            triggerEvent($table, 'check', row, $checkbox);
            $.bsTable.utils.executeFunction(settings.onCheck, row, $checkbox);
        } else {
            removeSelected($table, row);
            triggerEvent($table, 'uncheck', row, $checkbox);
            $.bsTable.utils.executeFunction(settings.onUncheck, row, $checkbox);
        }
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }
        $tr.toggleClass(activeClassName);

        const $tbody = $table.children('tbody'); // $table muss ein jQuery-Objekt sein!
        const $thead = $table.children('thead'); // $table muss ein jQuery-Objekt sein!
        const allCheckboxes = $($tbody).find(`.${bsTableClasses.checkInputBody}`);
        const allChecked = allCheckboxes.filter(':checked').length === allCheckboxes.length;
        const headerCheckbox = $($thead).find(`.${bsTableClasses.checkInputHeader}`);

        headerCheckbox.prop('checked', allChecked);
    }

    function handleRadiosByRadioChange($checkbox) {
        if (!$checkbox.length) {
            return;
        }
        const wrapper = $(getClosestWrapper($checkbox));
        const $table = $(getTableByWrapperId(wrapper.attr('id')));
        const $tr = $checkbox.closest('tr');
        const row = $tr.data('row');
        const settings = getSettings($table);
        const $thead = $($table.children('thead'));
        const headerCheckbox = $thead.find(`.${bsTableClasses.checkInputHeader}`);
        setSelected($table, []);
        headerCheckbox.prop('checked', true).prop('disabled', false);

        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }

        const allRadios = $($table.children('tbody')).find(`.${bsTableClasses.checkInputBody}`);
        allRadios.each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                const radioTr = radio.closest('tr');
                radioTr.removeClass(activeClassName);
                if (radio.is(':checked')) {
                    addSelected($table, row);
                    radioTr.addClass(activeClassName);
                    triggerEvent($table, 'check', radioTr.data('row'), radio);
                    $.bsTable.utils.executeFunction(settings.onCheck, radioTr.data('row'), radio);
                }
            }
        });
    }

    function handleCheckOnOrNone($checkbox) {
        if (!$checkbox.length) {
            return;
        }
        const wrapper = $(getClosestWrapper($checkbox));
        const table = $(getTableByWrapperId(wrapper.attr('id')));
        const settings = getSettings(table);
        const isChecked = $checkbox.prop('checked');
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }

        $(table.children('tbody'))
            .find(`.${bsTableClasses.checkInputBody}.bs-table-checkbox`)
            .each(function (_, el) {
                const radio = $(el);
                if (getClosestWrapper(radio)[0] === wrapper[0]) {
                    const tr = radio.closest('tr');

                    radio.prop('checked', isChecked);
                    if (isChecked) {
                        addSelected(table, tr.data('row'));
                        radio.closest('tr').addClass(activeClassName);
                    } else {
                        removeSelected(table, tr.data('row'));
                        radio.closest('tr').removeClass(activeClassName);
                    }
                }
            });
        if (isChecked) {
            triggerEvent(table, 'check-all');
            $.bsTable.utils.executeFunction(settings.onCheckAll);
        } else {
            triggerEvent(table, 'uncheck-all');
            $.bsTable.utils.executeFunction(settings.onUncheckAll);
        }
    }

// Funktion zur Suche auslagern für besseren Codefluss
    function performSearch(wrapper) {
        const table = getTableByWrapperId(wrapper.attr('id'));
        const settings = getSettings(table);
        settings.pageNumber = 1;
        setSettings(table, settings);
        refresh(table); // Tabelle aktualisieren
    }

    function handleUncheckRadios($checkbox) {
        if (!$checkbox.length) {
            return;
        }
        const wrapper = $(getClosestWrapper($checkbox));
        const table = $(getTableByWrapperId(wrapper.attr('id')));
        const settings = getSettings(table);
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }
        $(table.children('tbody'))
            .find(`.${bsTableClasses.checkInputBody}.bs-table-radio`)
            .each(function (_, el) {
                const radio = $(el);
                if (getClosestWrapper(radio)[0] === wrapper[0]) {
                    const tr = radio.closest('tr');
                    removeSelected(table, tr.data('row'));
                    radio.prop('checked', false);
                    radio.closest('tr').removeClass(activeClassName);
                }
            });
        triggerEvent(table, 'uncheck-all');
        $.bsTable.utils.executeFunction(settings.onUncheckAll);
        $checkbox.prop('disabled', true);
    }

    function registerGlobalTableEvents() {
        let searchTimeout;

        // Delegiere Events an ein Eltern-Element, z. B. `document`:
        $(document)
            .on(['click' + namespace, 'change' + namespace, 'input' + namespace, 'touchstart' + namespace, 'mouseenter' + namespace].join(' '), '.' + bsTableClasses.wrapper, function (e) {
                const $target = $(e.currentTarget);

                // Stelle sicher, dass nur das äußerste Element Events erhält
                if ($target.parents('.' + bsTableClasses.wrapper).length > 0) {
                    // noinspection UnnecessaryReturnStatementJS
                    return; // Ignoriere verschachtelte `bsTableClasses.wrapper`
                }

                // register events for the outer `.bsTableClasses.wrapper`
                // Depending on the type of event, you can differentiate here if necessary.
            })
            .on(['click' + namespace, 'change' + namespace, 'touchstart' + namespace, 'mouseenter' + namespace,].join(' '), `.${bsTableClasses.wrapper} [data-child="true"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} tbody > tr[data-index] > td`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $td = $(e.currentTarget);
                onClickCellAndRow($td);
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} thead th:first-child .${bsTableClasses.checkInputHeader}`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                const isCheckbox = $checkbox.hasClass('bs-table-checkbox');
                if (isCheckbox) {
                    handleCheckOnOrNone($checkbox);
                } else {
                    handleUncheckRadios($checkbox);
                }
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} tbody td:first-child .${bsTableClasses.checkInputBody}`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                const type = $checkbox.attr('type');
                if (type === 'radio') {
                    handleRadiosByRadioChange($checkbox);
                } else {
                    handleCheckboxChange($checkbox);
                }
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} thead th[data-sortable="true"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $th = $(e.currentTarget);
                handleSortOnTheadTh($th);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} [data-role="tablePaginationPageSize"] .dropdown-item`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $a = $(e.currentTarget);
                if (!$a.length) {
                    return;
                }
                const wrapper = getClosestWrapper($a);
                const table = getTableByWrapperId(wrapper.attr('id'));
                handleClickOnPaginationSize(table, $a);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnRefresh}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                refresh(table, null, true);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnToggle}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                toggleView(table);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnCustomView}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                toggleCustomView(table);
            })
            .on('input' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.searchInput}`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $searchField = $(e.currentTarget);
                if (!$searchField.length) {
                    return;
                }
                const wrapper = getClosestWrapper($searchField);

                clearTimeout(searchTimeout);

                searchTimeout = setTimeout(() => {
                    performSearch(wrapper);
                }, 600);

                if (e.key === "Enter") {
                    e.preventDefault(); // Prevent default behavior (e.g., form submit)
                    clearTimeout(searchTimeout);
                    performSearch(wrapper);
                }
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.pagination} .page-link`, function (e) {
                // Verhindere unerwünschte Browser- und DOM-Ereignisse
                e.preventDefault();             // Standardaktion verhindern
                e.stopPropagation();            // Ereignis weiter oben im DOM verhindern
                e.stopImmediatePropagation();   // Andere Handler für dieses Ereignis stoppen

                const $pageLink = $(e.currentTarget);

                // Safety: Überprüfen, ob das geklickte Element existiert
                if (!$pageLink.length) {
                    return;
                }

                const wrapper = getClosestWrapper($pageLink); // Funktion vorhanden


                // Tabelle und Einstellungen verarbeiten
                const table = getTableByWrapperId(wrapper.attr('id'));
                const settings = getSettings(table);
                const response = getResponse(table);

                // Berechnung der Seitenanzahl basierend auf der Antwort
                const totalPages = Math.ceil(response.total / settings.pageSize);

                // Verhindere Aktion, wenn der Link deaktiviert oder bereits aktiv ist
                if ($pageLink.parent().hasClass('disabled') || $pageLink.parent().hasClass('active')) {
                    return;
                }

                // Aktion vom Link holen
                const action = $pageLink.attr('data-role') || $pageLink.html().toLowerCase().trim();

                // Navigation Aktionen ausführen (vorherige, nächste oder spezifische Seite)
                if (action.includes('previous') || action.includes('left')) {
                    settings.pageNumber = Math.max(1, settings.pageNumber - 1);
                } else if (action.includes('next') || action.includes('right')) {
                    settings.pageNumber = Math.min(totalPages, settings.pageNumber + 1);
                } else {
                    const pageNum = parseInt($pageLink.text().trim(), 10);
                    if (!isNaN(pageNum)) {
                        settings.pageNumber = pageNum;
                    }
                }

                // Speichere die neuen Einstellungen und lade/aktualisiere den Tabelleninhalt
                setSettings(table, settings);
                refresh(table);
            });

        $.bsTable.globalEventsBound = true;
    }

}(jQuery))
