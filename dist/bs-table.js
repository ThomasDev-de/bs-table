(function ($) {
    "use strict";

    $.bsTable = {
        globalEventsBound: false,
        setDefaults: function (options) {
            this.defaults = $.extend(true, {}, this.defaults, options || {});
        },
        getDefaults: function () {
            return this.defaults;
        },
        defaults: {
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
            url: null,
            data: null,
            columns: [],
            showColumns: false,
            minimumCountColumns: 1,
            idField: null,
            clickToSelect: false,
            icons: {
                sortAsc: 'bi bi-caret-down-fill text-primary',
                sortDesc: 'bi bi-caret-up-fill text-primary',
                sortNone: 'bi bi-caret-down',
                refresh: 'bi bi-arrow-clockwise',
                search: 'bi bi-search',
                paginationNext: 'bi bi-chevron-right',
                paginationprev: 'bi bi-chevron-left',
                toggleOff: 'bi bi-toggle-off',
                toggleOn: 'bi bi-toggle-on',
            },
            rowStyle(row, index, $tr) {
            },
            queryParams(params) {
                return params;
            },
            responseHandler(res) {
                return res;
            },
            caption: null,
            onAll(eventName, ...args) {
            },
            onLoadSuccess() {
            },
            onLoadError() {
            },
            onPreBody(rows, $table) {
            },
            onPostHeader($thead, $table) {
            },
            onPostBody(rows, $table) {
            },
            onPostFooter($tfoot, $table) {
            },
            onRefresh(params) {
            },
            onSort(name, order) {
            },
            onClickCell(field, value, row, $td) {
            },
            onClickRow(row, $tr, field) {
            },
            onCheck(row, $input) {
            },
            onCheckAll() {
            },
            onUncheck(row, $input) {
            },
            onUncheckAll() {
            },
            formatNoMatches() {
                return `<i class="bi bi-x-lg fs-1 text-danger"></i>`;
            },
            formatSearch() {
                return `...`
            },
            formatShowingRows(pageFrom, pageTo, totalRows) {
                return `${pageFrom} - ${pageTo} / ${totalRows}`;
            },
            debug: false
        },
        utils: {
            sortArrayByField(data, field, order = "ASC") {
                // Sicherstellen, dass die Reihenfolge korrekt ist
                const direction = order.toUpperCase() === "DESC" ? -1 : 1;

                return data.sort((a, b) => {
                    // NULL-Werte nach hinten sortieren
                    if (a[field] == null && b[field] == null) return 0; // Beide NULL
                    if (a[field] == null) return 1 * direction; // `a` ist NULL → `b` vorher
                    if (b[field] == null) return -1 * direction; // `b` ist NULL → `a` vorher

                    // Zahlen- oder Stringvergleich
                    const aValue = typeof a[field] === "number" ? a[field] : a[field].toString().toLowerCase();
                    const bValue = typeof b[field] === "number" ? b[field] : b[field].toString().toLowerCase();

                    if (aValue > bValue) return 1 * direction;
                    if (aValue < bValue) return -1 * direction;

                    // Alles gleich: Reihenfolge beibehalten
                    return 0;
                });
            },
            calculateVisiblePagesOnNavigation(totalPages, currentPage) {
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
                if (functionOrName) {
                    // Direct Function Reference
                    if (typeof functionOrName === 'function') {
                        return functionOrName(...args);
                    }

                    // Check Function Name in String Format
                    if (typeof functionOrName === 'string') {
                        let func = null;

                        // Step 1: Check the local context
                        try {
                            func = new Function(`return typeof ${functionOrName} === 'function' ? ${functionOrName} : undefined`)();
                        } catch (error) {
                            // Ignore mistakes and move on to the next step
                        }

                        // Step 2: Check in the global 'window' context
                        if (!func && typeof window !== 'undefined' && typeof window[functionOrName] === 'function') {
                            func = window[functionOrName];
                        }

                        // If the function is found, run it
                        if (typeof func === 'function') {
                            return func(...args);
                        }
                    }
                }

                // Explicit return if nothing was executed
                return undefined;
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

    const namespace = '.bs.table';

    const bsTableClasses = {
        wrapper: 'bs-table', // Overall wrapper class
        overlay: 'bs-table-overlay', // For the visual loading overlay
        topContainer: 'bs-table-top-container', // Der Kontainer über der Tabelle
        bottomContainer: 'bs-table-bottom-container', // Der Kontainer unter der Tabelle
        search: 'bs-table-search', // Wrapper for the search field
        searchInput: 'bs-table-search-input', // The search input field
        buttons: 'bs-table-buttons', // Kontainer für die Buttons im TopKontainer
        btnRefresh: 'bs-table-btn-refresh',
        btnToggle: 'bs-table-btn-toggle-view',
        toolbar: 'bs-table-toolbar', // Toolbar Container
        pagination: 'bs-table-pagination', // Wrapper for the pagination controls
        paginationDetails: 'bs-table-pagination-details', // Wrapper for detailed pagination information
    };

    const methods = {
        refreshOptions($table, settings) {
            const setup = getSettings($table);
            $.extend(true, {}, setup, settings || {});
            setSettings($table, setup);
            refresh($table);
        },
        hideRowByIndex($table, rowIndex) {
            $table.children('tbody').children(`tr[data-index="${rowIndex}"]:not(.d-none)`).addClass('d-none');
        },
        showRowByIndex($table, rowIndex) {
            $table.children('tbody').children(`tr[data-index="${rowIndex}"].d-none`).removeClass('d-none');
        },
        showLoading($table) {
            const settings = getSettings($table);

            const wrapper = getWrapper($table);
            // Vorhandenes Overlay entfernen, falls vorhanden
            this.hideLoading($table);

            // Overlay generieren
            const $overlay = $('<div>', {
                class: bsTableClasses.overlay + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-body',
                css: {
                    zIndex: 4,
                    opacity: 0 // Das Overlay startet unsichtbar
                }
            }).appendTo(wrapper);

            // Placeholder-Struktur erstellen (Inhalt des Overlays)
            const $content = $(`
<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`).appendTo($overlay);

            // Sanftes Einblenden mit animate
            $overlay.animate({opacity: 0.75}, 100); // Dauer: 300ms
        },
        hideLoading($table) {
            const $overlay = getOverlay($table);
            if (!$overlay.length) return; // Abbruch, falls kein Overlay vorhanden ist

            // Vorherige Animation stoppen und sanftes Ausblenden starten
            $overlay.stop().animate({opacity: 0}, 100, function () {
                // Nach dem Ausblenden das Overlay vollständig entfernen
                $(this).remove();
            });
        }
    }

    function initTable($table, optionsOrMethod) {

        // Prüfen, ob die Tabelle bereits initialisiert ist
        if ($table.data('bsTable')) {
            // If the table has already been initialized and settings have been passed anyway,
            // refresh the settings
            if (typeof optionsOrMethod === 'object') {
                method.refreshOptions($table, optionsOrMethod);
            }
            return;
        }
        // If globa events has not been initialized, do so once
        if (!$.bsTable.globalEventsBound) {
            registerGlobalTableEvents(); // Globale Initialisierung binden (nur einmalig)
        }
        const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
        const settings = $.extend(true, {}, $.bsTable.getDefaults(), $table.data() || {}, options || {});

        if (!settings.columns || !Array.isArray(settings.columns)) {
            settings.columns = []; // Fallback, falls keine Spalten definiert sind
        }

        const bsTable = {
            settings: settings,
            toggleView: false,
            response: []
        };

        // Initialize the table with data
        $table.data('bsTable', bsTable);

        // Create Structure Elements of the Table
        build.structure($table);

        // Update table (e.g. load or render data)
        refresh($table);
    }

    $.fn.bsTable = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            return this; // No element selected
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
                case 'getSettings': {
                    return getSettings($table);
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
                    }
                    break;
                }

                case 'showRow': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object' && arg.hasOwnProperty('index')) {
                        methods.showRowByIndex($table, arg.index);
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
        let caption = $table.find('caption:first');
        const isEmpty = $.bsTable.utils.isValueEmpty(stringOrObject);
        if (isEmpty) {
            caption.remove();
            return;
        }
        const captionClasses = [];
        const isString = typeof stringOrObject === 'string';
        const isObject = typeof stringOrObject === 'object';
        const captionText = isString ? stringOrObject : isObject ? stringOrObject.text : null;
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
            if (options.silent) silent = options.silent;
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
        build.table($table);
    }

    /**
     * Fetches data for a table, handling local or remote data sources,
     * sorting, pagination, and optional search functionality.
     *
     * @param {jQuery} $table The jQuery object representing the table for which data is being fetched.
     * @param {boolean} [triggerRefresh=false] Indicates whether a "refresh" event should be triggered during data fetching.
     * @return {Promise} A promise that resolves when the data has been successfully fetched and processed,
     *                   or rejects if there is an error during the data fetching process.
     */
    function fetchData($table, triggerRefresh = false) {
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

            // Handle limit and offset
            // Pagination prüfen und anpassen
            const pageNumber = settings.pageNumber > 0 ? settings.pageNumber : 1;
            const pageSize = settings.pageSize ?? 10; // Setze Standardwert, falls pageSize nicht definiert ist

            if (pageSize === 0) {
                if (settings.debug) {
                    console.log("Besonderer Fall: pageSize = 0 (Alle Datensätze anzeigen).");
                }
                params.limit = null; // Keine Begrenzung
                params.offset = 0;   // Keine Verschiebung
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
            const searchInput = getSearchInput($table);
            if (settings.search && searchInput.length) {
                const searchValue = searchInput.val()?.trim() || null;
                params.search = searchValue && !$.bsTable.utils.isValueEmpty(searchValue) ? searchValue : null;
                if (settings.debug) {
                    console.log("Suchkriterien verarbeitet:", params.search); // DEBUG
                }
            }

            // handle custom params
            // Zusätzliche Query-Parameter vom User
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

            // Verarbeitung von lokalen Daten
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

                // Suche anwenden, falls relevant
                if (params.search) {
                    if (settings.debug) {
                        console.log("Suchfilter wird angewendet: ", params.search); // DEBUG
                    }
                    filteredData = filteredData.filter(row =>
                        Object.values(row).some(value =>
                            value && value.toString().toLowerCase().includes(params.search.toLowerCase())
                        )
                    );
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
                            const processedResponse = Array.isArray(response)
                                ? {rows: response, total: response.length}
                                : {...response, rows: response.rows || [], total: response.total || 0};

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
                                const processedResponse = Array.isArray(response)
                                    ? {rows: response, total: response.length}
                                    : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                                $table.data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .catch(error => {
                                if (settings.debug) {
                                    console.error("Fehler bei Funktions-URL-Verarbeitung:", error); // DEBUG
                                }
                                reject(new Error(`Fehler bei der Verarbeitung der Funktion: ${error.message || error}`));
                            });
                    } else {
                        // 'url' is an actual URL and not a function name
                        let defaultAjaxOptions = {
                            url: settings.url,
                            method: "GET",
                            data: params,
                            dataType: "json"
                        };
                        const customAjaxOptions = $.bsTable.utils.executeFunction(settings.ajaxOptions, settings.url, params);
                        if (customAjaxOptions && typeof customAjaxOptions === 'object') {
                            defaultAjaxOptions = $.extend(true, {}, defaultAjaxOptions, customAjaxOptions || {});
                        }
                        const xhr = $table.data('xhr') || null;
                        if (xhr !== null) {
                            xhr.abort();
                            $table.removeData('xhr');
                        }
                        $table.data('xhr', $.ajax(defaultAjaxOptions)
                            .done(response => {
                                const processedResponse = Array.isArray(response)
                                    ? {rows: response, total: response.length}
                                    : {...response, rows: response.rows || [], total: response.total || 0};

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
                            })
                        );
                    }
                }
            }
        });
    }

    const build = {
        structure($table) {
            return new Promise((resolve, reject) => {
                $table.empty();
                const settings = getSettings($table);
                const wrapperId = getUniqueId();
                const $wrapper = $('<div>', {
                    class: bsTableClasses.wrapper + ' position-relative',
                    id: wrapperId,
                }).insertAfter($table);
                const isChild = getClosestWrapper($wrapper).length > 0 ? 'true' : 'false';
                $wrapper.attr('data-child', isChild);
                $table.attr('data-wrapper', wrapperId);

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
                $table.addClass(tableClasses.join(' '));
                $table.appendTo($wrapper);
                setCaption($table, settings.caption);

                this.tableTopContainer($table);
                this.tableBottomContainer($table);

                $('<thead></thead>').appendTo($table);
                $('<tbody></tbody>').appendTo($table);
                $('<tfoot></tfoot>').appendTo($table);
                resolve();
            });

        },
        dropdownPageList($table) {
            const settings = getSettings($table);
            const response = getResponse($table);
            const totalRows = response.total || (response.rows ? response.rows.length : 0);
            // Berechnung der Anzeige-Daten (Start- und Endzeilen)
            const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
            const currentPage = settings.pageNumber || 1;
            const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const endRow = Math.min(totalRows, currentPage * pageSize);

            // Haupt-Wrapper (d-flex für Flexbox)
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group',
                'data-role': 'tablePaginationPageSize'
            });
            // Dropdown für die Zeilenanzahl pro Seite
            const $dropdownToggle = $('<button>', {
                'class': 'btn btn-secondary dropdown-toggle',
                'type': 'button',
                'id': 'dropdownPaginationPageSize',
                'data-bs-toggle': 'dropdown',
                'aria-expanded': 'false'
            }).html((pageSize === totalRows ? 'All' : pageSize));

            const $dropdownMenu = $('<ul>', {
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
                    const $dropdownItem = $('<li>').append(
                        $('<a>', {
                            class: `dropdown-item ${isActive ? 'active' : ''}`,
                            href: '#',
                            'data-page': value
                        }).text(text)
                    );
                    $dropdownMenu.append($dropdownItem);
                });

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        },
        dropdownColumns($table) {
            const settings = getSettings($table);

            if (!settings.columns || !settings.columns.length) {
                return null; // Keine Spalten vorhanden
            }

            // Haupt-Wrapper des Dropdowns
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group',
                'data-role': 'tableColumnVisibility'
            });

            // Dropdown-Toggle-Button
            const $dropdownToggle = $('<button>', {
                'class': 'btn btn-secondary dropdown-toggle',
                'type': 'button',
                'id': 'dropdownColumnVisibility',
                'data-bs-toggle': 'dropdown',
                'data-bs-auto-close': "outside",
                'aria-expanded': 'false'
            }).html('<i class="bi bi-layout-three-columns"></i>');

            // Dropdown-Menü
            const $dropdownMenu = $('<div>', {
                'class': 'dropdown-menu bg-gradient dropdown-menu-end',
                'aria-labelledby': 'dropdownColumnVisibility'
            });

            let colIndex = 0;

            // Zähler für sichtbare Spalten
            let checkedColumnsCount = settings.columns.filter(column => column.visible !== false).length;

            // Funktion: Aktivieren oder Deaktivieren von Checkboxen basierend auf Mindestanzahl an sichtbaren Spalten
            function updateCheckboxStates() {
                const checked = $dropdownMenu.find('input[type="checkbox"]:checked'); // Alle aktivierten Checkboxen
                const notChecked = $dropdownMenu.find('input[type="checkbox"]:not(:checked)'); // Alle deaktivierten Checkboxen

                // Wenn die Anzahl gecheckter Checkboxen <= minimumCountColumns ist, deaktiviere die gecheckten Checkboxen
                if (checked.length <= settings.minimumCountColumns) {
                    checked.prop('disabled', true); // Gecheckte Checkboxen deaktivieren
                } else {
                    checked.prop('disabled', false); // Gecheckte Checkboxen aktivieren, wenn Limit nicht erreicht
                }

                // Nicht gecheckte Checkboxen bleiben immer aktiv (disable = false)
                notChecked.prop('disabled', false);
            }

            // Für jede Spalte eine Checkbox hinzufügen

            settings.columns.forEach((column, index) => {
                const isVisible = column.visible !== false;

                // Überspringen von Spalten mit `checkbox` oder `radio`
                if (column.checkbox || column.radio) return;
                const uniqueId = getUniqueId('bs_table_column_visibility_');
                // Erstelle ein Menü-Item mit Checkbox
                const $menuItem = $('<div>', {'class': 'dropdown-item px-3'}).append(
                    $('<div>', {'class': 'form-check d-flex align-items-center'}).append(
                        $('<input>', {
                            'class': 'form-check-input me-2', // Abstand zur Checkbox hinzufügen
                            'type': 'checkbox',
                            'id': `${uniqueId}`,
                            'data-column-index': colIndex,
                            'checked': isVisible
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
                        }),
                        $('<label>', {
                            'class': 'form-check-label mb-0',
                            'for': `${uniqueId}`
                        })
                            .text(column.title || column.field || `Column ${colIndex + 1}`)
                            .on('click' + namespace, function (e) {
                                e.preventDefault(); // Verhindert das Schließen des Dropdowns
                                const label = $(e.currentTarget);
                                const $checkbox = $(`#${label.attr('for')}`); // Checkbox anhand der ID finden
                                $checkbox.prop('checked', !$checkbox.is(':checked')).trigger('change' + namespace); // Checkbox toggeln und Change-Event auslösen
                            })
                    )
                );

                $dropdownMenu.append($menuItem);
                colIndex++;
            });

            // Initiale Deaktivierungsprüfung
            updateCheckboxStates();

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        },
        buttons($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);
            const $btnContainer = $wrapper.find(`.${bsTableClasses.buttons}:first`).empty();

            if (settings.showRefresh === true) {
                const $refreshButton = $(`<button>`, {
                    class: 'btn btn-secondary ' + bsTableClasses.btnRefresh,
                    html: `<i class="${settings.icons.refresh}"></i>`,
                }).appendTo($btnContainer);
            }

            if (settings.showToggle === true) {
                const toggleIcon = getToggleView($table) ? settings.icons.toggleOn : settings.icons.toggleOff;
                const $toggleButton = $(`<button>`, {
                    class: 'btn btn-secondary ' + bsTableClasses.btnToggle,
                    html: `<i class="${toggleIcon}"></i>`,
                }).prependTo($btnContainer);
            }

            if (settings.showColumns === true) {
                this.dropdownColumns($table).prependTo($btnContainer);
            }

            if (!($.bsTable.utils.isValueEmpty(settings.pageList) || settings.pagination === false)) {
                this.dropdownPageList($table).prependTo($btnContainer);
            }
        },
        tableTopContainer($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);

            let flexClass = 'flex-row';
            if (!['right', 'end'].includes(settings.paginationHAlign)) {
                flexClass += ' flex-row-reverse';
            }

            let gapClass = '';
            if (
                (settings.pagination === true && ['top', 'both'].includes(settings.paginationVAlign)) ||
                settings.search === true ||
                settings.toolbar ||
                settings.showRefresh
            ) {
                gapClass = 'gap-2 py-2';
            }

            const template = `
            <div class="d-flex flex-column ${gapClass} ${bsTableClasses.topContainer}">
                <div class="d-flex justify-content-end align-items-end">
                    <div class="d-flex ${bsTableClasses.toolbar} me-auto">
                    </div>
                    <div class="d-flex ${bsTableClasses.search}">
                    </div>
                    <div class="btn-group ${bsTableClasses.buttons}">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-end ${flexClass}">
                    <div class="${bsTableClasses.paginationDetails}"></div>
                    <div class="${bsTableClasses.pagination} top"></div>
                </div>
            </div>`;

            // Top Container bestehend aus 1-n Zeilen
            const $tableTopContainer = $(template).prependTo($wrapper);
            const $toolbarContainer = $tableTopContainer.find('.' + bsTableClasses.toolbar);
            const $searchWrapper = $tableTopContainer.find('.' + bsTableClasses.search);


            // Falls ein Toolbar-Element definiert ist, füge dieses in die erste Zeile und
            // setze margin end auf auto, damit sie links zentriert ist
            if (settings.toolbar && $(settings.toolbar).length > 0) {
                $(settings.toolbar).prependTo($toolbarContainer);
            }

            // Such-Wrapper erstellen (links)
            // Falls die Suche aktiviert ist, füge ein Input-Feld und Logik hinzu
            if (settings.search === true) {
                const placeholder = $.bsTable.utils.executeFunction(settings.formatSearch)
                const $searchInputGroup = $(`
    <div class="input-group">
        <span class="input-group-text"><i class="${settings.icons.search}"></i></span>
        <input type="search" class="form-control ${bsTableClasses.searchInput}" placeholder="${placeholder}">
    </div>
`);
                $searchInputGroup.appendTo($searchWrapper);
            }


            this.buttons($table);
        },
        tableBottomContainer($table) {
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

            const template = `
            <div class="d-flex flex-column ${gapClass} ${bsTableClasses.bottomContainer}">
                <div class="d-flex justify-content-between align-items-start ${flexClass}">
                    <div class="${bsTableClasses.paginationDetails}"></div>
                    <div class="${bsTableClasses.pagination} bottom"></div>
                </div>
            </div>`;
            $(template).appendTo($wrapper);
        },
        pagination($table, totalRows) {
            const settings = getSettings($table);

            // Berechne die Gesamtanzahl der Seiten
            const totalPages = Math.ceil(totalRows / settings.pageSize);
            const currentPage = settings.pageNumber || 1;

            const $paginationWrapper = $('<nav></nav>', {'data-role': 'tablePagination'});

            const $paginationList = $('<ul></ul>', {
                class: 'pagination justify-content-center m-0'
            }).appendTo($paginationWrapper);


            // "Previous"-Button
            const $prevItem = $('<li></li>', {
                'data-role': 'previous',
                class: `page-item ${currentPage === 1 ? 'disabled' : ''}`
            }).appendTo($paginationList);

            $('<a></a>', {
                class: 'page-link',
                href: '#',
                tabindex: currentPage === 1 ? '-1' : '',
                'aria-disabled': currentPage === 1 ? 'true' : 'false',
                html: `<i class="${settings.icons.paginationprev}"></i>`,
            }).appendTo($prevItem).on('click', function (e) {
                e.preventDefault();
                if (currentPage > 1) {
                    settings.pageNumber = currentPage - 1;
                    setSettings($table, settings);
                    refresh($table);
                }
            });

            // Sichtbare Seiten (berechne die Seitennummern)
            const visiblePages = $.bsTable.utils.calculateVisiblePagesOnNavigation(totalPages, currentPage);

            visiblePages.forEach(page => {
                if (page === "...") {
                    $('<li></li>', {
                        class: 'page-item disabled'
                    }).append(
                        $('<a></a>', {
                            class: 'page-link',
                            text: '...'
                        })
                    ).appendTo($paginationList);
                } else {
                    const $pageItem = $('<li></li>', {
                        class: `page-item ${page === currentPage ? 'active' : ''}`
                    }).appendTo($paginationList);

                    $('<a></a>', {
                        class: 'page-link',
                        href: '#',
                        text: page
                    }).appendTo($pageItem).on('click', function (e) {
                        e.preventDefault();
                        if (page !== currentPage) {
                            settings.pageNumber = page;
                            setSettings($table, settings);
                            refresh($table);
                        }
                    });
                }
            });

            // "Next"-Button
            const $nextItem = $('<li></li>', {

                class: `page-item ${currentPage === totalPages ? 'disabled' : ''}`
            }).appendTo($paginationList);

            $('<a></a>', {
                'data-role': 'next',
                class: 'page-link',
                href: '#',
                tabindex: currentPage === totalPages ? '-1' : '',
                'aria-disabled': currentPage === totalPages ? 'true' : 'false',
                html: `<i class="${settings.icons.paginationNext}"></i>`,
            }).appendTo($nextItem).on('click', function (e) {
                e.preventDefault();
                if (currentPage < totalPages) {
                    settings.pageNumber = currentPage + 1;
                    setSettings($table, settings);
                    refresh($table);
                }
            });


            return $paginationWrapper;
        },
        paginationDetails($table, totalRows) {
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
            const $paginationText = $('<div>')
                .html(`<div class="">${text}</div>`);

            const $allDestinations = wrapper.find('.' + bsTableClasses.paginationDetails);

            if ($allDestinations.length > 0) {
                const $first = $allDestinations.first().empty();
                const $last = $allDestinations.last().empty();

                $paginationText.clone().appendTo($first);
                $paginationText.clone().appendTo($last);
            }
        },
        table($table) {
            const settings = getSettings($table);
            if (settings.debug) {
                console.groupCollapsed("Render Table");
            }
            const wrapper = getClosestWrapper($table);
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
                this.tfoot($table, response.rows);
            }

            build.buttons($table);
            const $topPaginationContainer = getPaginationContainer($table, true).empty();
            const $bottomPaginationContainer = getPaginationContainer($table, false).empty();
            build.paginationDetails($table, totalRows);
            const $tableTopContainer = getTableTopContainer($table);
            const $btnContainer = $tableTopContainer.find(`.${bsTableClasses.buttons}:first`);


            if ($btnContainer.find('.btn').length && settings.search === true) {
                // haben wir buttons und ein suchfeld, packe margin hinzu
                $btnContainer.addClass('ms-2');
            } else {
                // andernfalls entferne den margin
                $btnContainer.removeClass('ms-2');
            }

            if (settings.pagination && pageSize !== 0) {
                const $wrapper = getWrapper($table);
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
            const showHeader = columns.length && settings.showHeader === true && !getToggleView($table);
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

            const $thead = $table.children('thead').empty().addClass(headerClasses.join(' '));
            if(showHeader) {
                $thead.removeClass('d-none');
            }
            const $tr = $('<tr></tr>').appendTo($thead);
            if (showHeader) {
                if (showCheckItem($table)) {
                    buildCheckboxOrRadio($table, $tr, null);
                }
                let colIndex = 0;
                columns.forEach(column => {
                    if (column.checkbox === true || column.radio === true) return;
                    this.theadTr(column, $tr, colIndex);
                    colIndex++;
                });

                triggerEvent($table, 'post-header', $thead, $table);
                $.bsTable.utils.executeFunction(settings.onPostHeader, $thead, $table);
            }
        },
        theadTr(column, $tr, colIndex) {
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
            if (column.width) $th.css('width', column.width);

            // Build class list
            const alignmentClasses = {
                end: 'text-end',
                right: 'text-end',
                start: 'text-start',
                left: 'text-start',
                center: 'text-center',
                middle: 'text-center'
            };

            const classList = [
                column.halign && alignmentClasses[column.halign] ? alignmentClasses[column.halign] : '',
                column.visible === false ? 'd-none' : ''
            ].filter(Boolean);

            if (classList.length) $th.addClass(classList.join(' '));
        },
        tbody($table, rows) {
            const settings = getSettings($table);
            triggerEvent($table, 'pre-body', rows, $table);
            $.bsTable.utils.executeFunction(settings.onPreBody, rows, $table);
            const hasColumns = settings.columns && settings.columns.length;
            const columns = hasColumns ? settings.columns : [];
            const hasCheckbox = columns.some(column => column.checkbox === true);
            const $tbody = $table.children('tbody').empty();
            const inToggleView = getToggleView($table);

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

            if (rows && rows.length) {

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
                            buildCheckboxOrRadio($table, $tr, row)
                        }
                        let colIndex = 0;
                        settings.columns.forEach(column => {
                            if (column.checkbox === true || column.radio === true) return;
                            this.tbodyTd(column, row, $tr, colIndex, inToggleView);
                            colIndex++;
                        });
                    }
                    trIndex++;
                })
            } else {
                const $tr = $('<tr></tr>').appendTo($tbody);
                const $td = $('<td>', {
                    colspan: getCountColumns($table),
                    class: 'text-center',
                    html: settings.formatNoMatches(),
                }).appendTo($tr);
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
                    'data-col-index': colIndex,
                    class: classList.join(' '),
                }).appendTo($tr);

                if(inToggleView) {
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

                // Wenn `events` definiert ist, registriere diese für die Zelle
                if (column.events) {
                    for (const [eventSelector, eventHandler] of Object.entries(column.events)) {
                        // Eventtypen und Selektor extrahieren
                        const splitEvent = eventSelector.split(' '); // Teile nach Leerzeichen
                        const selector = splitEvent.pop(); // Das letzte Element ist der Selektor (z.B. "span")
                        const eventTypes = splitEvent.join(' '); // Alles außer dem Selektor sind Eventtypen

                        // Überprüfe, ob ein spezifischer Selektor angegeben ist
                        if (selector) {
                            // Binde das Event mit Delegation, falls ein Selektor definiert ist
                            $td.on(eventTypes, selector, function (e) {
                                eventHandler(e, row[column.field] ?? null, row, trIndex);
                            });
                        } else {
                            // Binde das Event direkt an die Zelle, wenn kein Selektor vorhanden ist
                            $td.on(eventTypes, function (e) {
                                eventHandler(e, row[column.field] ?? null, row, trIndex);
                            });
                        }
                    }
                }
            }
        },
        tfoot($table, data) {
            const settings = getSettings($table);
            const columns = settings.columns || [];
            const showFooter = columns.length && settings.showFooter === true && !getToggleView($table);

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
                    if (column.checkbox === true || column.radio === true) return;
                    this.tfootTr(column, $tr, colIndex, data);
                    colIndex++;
                })

                // Nur die Daten der aktuellen Seite an onPostFooter übergeben
                triggerEvent($table, 'post-footer', $tfoot, $table);
                $.bsTable.utils.executeFunction(settings.onPostFooter, $tfoot, $table);
            }
        },
        tfootTr(column, $tr, colIndex, data) {
            const $table = $tr.closest('table');
            const settings = getSettings($table);

            // Formatierer-Wert prüfen und zuweisen
            const formatterValue = $.bsTable.utils.executeFunction(column.footerFormatter, data);
            const value = !$.bsTable.utils.isValueEmpty(formatterValue) ? formatterValue : '';

            // <th>-Element erstellen
            const $th = $('<th>', {
                html: value,
                'data-col-index': colIndex
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
            const classList = [
                column.falign && alignmentClasses[column.falign] ? alignmentClasses[column.falign] : '',
                column.visible === false ? 'd-none' : ''
            ].filter(Boolean);

            // Apply classes, if available
            if (classList.length) {
                $th.addClass(classList.join(' '));
            }
        }
    };


    function showCheckItem($table) {
        const settings = getSettings($table);
        const columns = settings.columns || [];
        if (!columns.length || !settings.idField) return false;

        const hasCheckItem = columns.some(column => column.checkbox === true || column.radio === true);
        if (!hasCheckItem) {
            return false;
        }

        return columns.some(column => column.field === settings.idField);
    }

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
            asc: icons.sortAsc,
            desc: icons.sortDesc,
            default: icons.sortNone
        };
        return iconMap[sortOrder] || iconMap.default;
    }

    function buildCheckboxOrRadio($table, $tr, row = null) {
        const settings = getSettings($table);
        const defaultIdField = settings.idField;
        const columns = settings.columns;
        const forHeader = $.bsTable.utils.isValueEmpty(row);

        // Prüfen, ob überhaupt Spalten vorhanden und valide sind
        if (!columns || !columns.length || !Array.isArray(columns)) {
            return false;
        }

        // Suche bevorzugt nach einer Spalte mit checkbox:true, ansonsten radio:true
        const column =
            columns.find(column => column.checkbox === true) ||
            columns.find(column => column.radio === true);

        if (!column || (!column.field && !defaultIdField)) {
            return false; // Keine Checkbox- oder Radio-Spalte gefunden
        }

        const field = column.field ?? defaultIdField;

        const $thCheckbox = $(forHeader ? '<th></th>' : '<td></td>', {
            class: 'text-center align-middle',
            'data-role': 'tableCellCheckbox',
        }).appendTo($tr);

        // Checkbox oder Radio bestimmen
        const isCheckbox = column.checkbox === true;
        // if (!isCheckbox && forHeader) {
        //     return false;
        // }
        const inputType = isCheckbox || (!isCheckbox && forHeader) ? 'checkbox' : 'radio';
        if (forHeader) {
            $thCheckbox.css('width', '50px');
        }

        const $thCheckboxWrapper = $('<div></div>', {
            class: 'form-check form-switch'
        }).appendTo($thCheckbox);

        const dataRole = forHeader ?
            (isCheckbox ? 'tableHeaderCheckbox' : 'tableHeaderRadio') :
            (isCheckbox ? 'tableCheckbox' : 'tableRadio');

        const $thCheckboxInput = $('<input>', {
            id: getUniqueId(`bs_table_${inputType}_`),
            'data-role': dataRole,
            class: 'form-check-input float-none',
            type: inputType, // Hier wird der Typ festgelegt (checkbox oder radio)
        }).appendTo($thCheckboxWrapper);

        if (!isCheckbox && forHeader) {
            $thCheckboxInput.prop('disabled', true);
        }

        const $thCheckboxLabel = $('<label></label>', {
            class: 'form-check-label d-none m-0 p-0',
            for: $thCheckboxInput.attr('id'),
            html: forHeader ? '' : column.title,
        }).appendTo($thCheckboxWrapper);

        // Füge spezifische Attribute hinzu, wenn Zeilen-Daten vorhanden sind
        if (row) {
            $thCheckboxInput.attr('value', row[field] ?? null);
            // Verhalten abhängig vom Typ
            if (isCheckbox) {
                // Für Checkboxen bleibt der Name ein Array
                $thCheckboxInput.attr('name', `${field}[]`);
            } else {
                // Für Radio-Buttons entfernen wir das Array-Suffix []
                $thCheckboxInput.attr('name', field);
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
        const hasCheckboxOrRadio = settings.columns.some(column => column.checkbox === true || column.radio === true);

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

    function setToggleView($table, toggleView) {
        const data = $table.data('bsTable');
        if (data) {
            data.toggleView = toggleView;
        }
        $table.data('bsTable', data);
    }

    function getWrapper($table) {
        return $table.closest(`.${bsTableClasses.wrapper}`);
    }

    function getClosestWrapper($element) {
        return $element.closest(`.${bsTableClasses.wrapper}`);
    }

    function getTableBottomContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        return $wrapper.children(`.${bsTableClasses.bottomContainer}`).first();
    }

    function getTableTopContainer($table) {
        const $wrapper = getWrapper($table);
        return $wrapper.children(`.${bsTableClasses.topContainer}`).first();
    }

    function getPaginationContainer($table, top) {
        if (top) {
            return getTableTopContainer($table).find('.' + bsTableClasses.pagination);
        } else {
            return getTableBottomContainer($table).find('.' + bsTableClasses.pagination);
        }
    }

    function getPaginationDetailsContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        // Finde den Pagination-Container und stelle sicher, dass er direkt zum aktuellen Wrapper gehört
        const $pagination = $wrapper.find(`.${bsTableClasses.paginationDetails}`).filter(function () {
            // Überprüfe, ob der Pagination-Container direkt dem aktuellen Wrapper zugeordnet ist
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Hole nur den ersten passenden Pagination-Container

        return $pagination.length > 0 ? $pagination : $(); // Fallback: Leeres jQuery-Objekt, wenn keiner gefunden
    }

    function getSearchInput($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper

        // Finde den einzigen Such-Input im Wrapper, aber ignoriere Inputs aus untergeordneten Wrappers
        const $searchInput = $wrapper.find('.' + bsTableClasses.searchInput).filter(function () {
            // Stelle sicher, dass der Input direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur den ersten gefilterten Input holen (falls mehr als einer gefunden wird)

        return $searchInput.length > 0 ? $searchInput : $(); // Fallback: leeres jQuery-Objekt, falls nichts gefunden
    }

    function getUniqueId(prefix = "bs_table_wrapper_") {

        const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            const random = Math.random() * 16 | 0;
            const value = char === 'x' ? random : (random & 0x3 | 0x8);
            return value.toString(16);
        });

        // Falls Unterstriche statt Minuse gewünscht sind
        const modifiedGuid = guid.replace(/-/g, '_');

        return prefix + modifiedGuid;
    }


    function getOverlay($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper

        // Finde das Overlay im aktuellen Wrapper, ignoriere Overlays in verschachtelten Wrappers
        const $overlay = $wrapper.find('.' + bsTableClasses.overlay).filter(function () {
            // Überprüfe, ob dieses Overlay direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur das erste Overlay holen (falls mehrere gefunden werden)

        return $overlay.length > 0 ? $overlay : $(); // Fallback: leeres jQuery-Objekt, falls kein Overlay gefunden wurde
    }


    function handleSortOnTheadTh($th) {
        const wrapper = getClosestWrapper($th);
        const $table = getTableByWrapperId(wrapper.attr('id'));
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
        const trIndex = $td.data('trIndex');
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
            table: targetTable,
            settings: settings,
            isChildTable: isSubTable,
            hasChildTables: hasSubTables,
        }

        const event = $.Event(eventName + namespace, {
            target: targetTable,
            bsTable: bsTableDatas,
        });

        $table.trigger(event, args);
        event.stopPropagation();

        if (eventName !== 'all') {
            const allEvent = $.Event(`all${namespace}`, {target: targetTable});
            $table.trigger(allEvent, [eventName + namespace, ...args]);
            allEvent.stopPropagation();
        }
    }


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
        if (!$checkbox.length) return;
        const wrapper = getClosestWrapper($checkbox);
        const table = getTableByWrapperId(wrapper.attr('id'));
        const $tr = $checkbox.closest('tr');
        const isChecked = $checkbox.is(':checked');
        const settings = getSettings(table);
        const row = $tr.data('row');
        if (isChecked) {
            triggerEvent(table, 'check', row, $checkbox);
            $.bsTable.utils.executeFunction(settings.onCheck, row, $checkbox);
        } else {
            triggerEvent(table, 'uncheck', row, $checkbox);
            $.bsTable.utils.executeFunction(settings.onUncheck, row, $checkbox);
        }
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }
        $tr.toggleClass(activeClassName);
    }

    function handleRadiosByRadioChange($checkbox) {
        if (!$checkbox.length) return;
        const wrapper = getClosestWrapper($checkbox);
        const table = getTableByWrapperId(wrapper.attr('id'));
        const $tr = $checkbox.closest('tr');
        const row = $tr.data('row');
        const value = $checkbox.attr('value');
        const settings = getSettings(table);
        const headerCheckbox = table.find(`[data-role="tableHeaderRadio"]:first`);

        headerCheckbox.prop('checked', true).prop('disabled', false);

        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }

        table.find('[data-role="tableRadio"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                const radioTr = radio.closest('tr');
                radioTr.removeClass(activeClassName);
                if (radio.is(':checked')) {
                    radioTr.addClass(activeClassName);
                    triggerEvent(table, 'check', radioTr.data('row'), radio);
                    $.bsTable.utils.executeFunction(settings.onCheck, radioTr.data('row'), radio);
                }
            }
        });
    }

    function handleCheckOnOrNone($checkbox) {
        if (!$checkbox.length) return;
        const wrapper = getClosestWrapper($checkbox);
        const table = getTableByWrapperId(wrapper.attr('id'));

        const $tr = $checkbox.closest('tr');
        const settings = getSettings(table);
        const isChecked = $checkbox.prop('checked');
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }
        table.find('[data-role="tableCheckbox"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                radio.prop('checked', isChecked);
                if (isChecked) {
                    radio.closest('tr').addClass(activeClassName);
                } else {
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
        if (!$checkbox.length) return;
        const wrapper = getClosestWrapper($checkbox);
        const $tr = $checkbox.closest('tr');
        const table = getTableByWrapperId(wrapper.attr('id'));
        const settings = getSettings(table);
        let activeClassName = 'table-active'
        if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
            activeClassName = settings.classes.active;
        }
        table.find('[data-role="tableRadio"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
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
            .on([
                'click' + namespace,
                'change' + namespace,
                'input' + namespace,
                'touchstart' + namespace,
                'mouseenter' + namespace
            ].join(' '), '.' + bsTableClasses.wrapper, function (e) {
                const $target = $(e.currentTarget);

                // Stelle sicher, dass nur das äußerste Element Events erhält
                if ($target.parents('.' + bsTableClasses.wrapper).length > 0) {
                    return; // Ignoriere verschachtelte `bsTableClasses.wrapper`
                }

                // Events für das äußere `.bsTableClasses.wrapper` registrieren
                // Je nach Ereignistyp kannst du hier differenzieren, falls nötig.
            })
            .on([
                'click' + namespace,
                'change' + namespace,
                'touchstart' + namespace,
                'mouseenter' + namespace,
            ].join(' '), `.${bsTableClasses.wrapper} [data-child="true"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} tbody > tr > td`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $td = $(e.currentTarget);
                onClickCellAndRow($td);
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} thead [data-role="tableHeaderRadio"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleUncheckRadios($checkbox);
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} thead [data-role="tableHeaderCheckbox"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleCheckOnOrNone($checkbox);
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} table tbody [data-role="tableRadio"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleRadiosByRadioChange($checkbox);
            })
            .on('change' + namespace, `.${bsTableClasses.wrapper} tbody [data-role="tableCheckbox"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleCheckboxChange($checkbox);
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
                if (!$a.length) return;
                const wrapper = getClosestWrapper($a);
                const table = getTableByWrapperId(wrapper.attr('id'));
                handleClickOnPaginationSize(table, $a);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnRefresh}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) return;
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                refresh(table, null, true);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnToggle}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) return;
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                toggleView(table);
            })
            .on('input' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.searchInput}`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $searchField = $(e.currentTarget);
                if (!$searchField.length) return;
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
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $pageLink = $(e.currentTarget);
                if (!$pageLink.length) return;
                const wrapper = getClosestWrapper($pageLink);
                const table = getTableByWrapperId(wrapper.attr('id'));
                const settings = getSettings(table);
                const response = getResponse(table);
                const totalPages = Math.ceil(response.total / settings.pageSize);
                if ($pageLink.parent().hasClass('disabled') || $pageLink.parent().hasClass('active')) {
                    return;
                }
                const action = $pageLink.attr('data-role') || $pageLink.html().toLowerCase().trim();
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
                setSettings(table, settings);
                refresh(table);
            });

        $.bsTable.globalEventsBound = true;
    }

}(jQuery))
