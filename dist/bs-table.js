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
            classes: 'table',
            toolbar: null,
            pagination: true,
            sidePagination: 'client',
            paginationVAlign: 'bottom',
            paginationHAlign: 'end',
            pageNumber: 1,
            pageSize: 10,
            pageList: [5, 10, 25, 50, 100, 200, 'All'],
            search: true,
            sortName: null,
            sortOrder: 'asc',
            showRefresh: true,
            showHeader: true,
            showFooter: false,
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
        }
    };

    const wrapperClass = 'bs-table-wrapper';
    const wrapperTableClass = 'bs-table-inner-wrapper';
    const wrapperOverlayClass = 'bs-table-wrapper-overlay';
    const wrapperSearchClass = 'bs-table-wrapper-search';
    const wrapperPaginationClass = 'bs-table-pagination-container';
    const wrapperPaginationDetailsClass = 'bs-table-pagination-details';
    const inputSearchClass = 'bs-table-search-input';
    const namespace = '.bs.table';

    $.fn.bsTable = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            return;
        }
        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).bsTable(optionsOrMethod, ...args);
            });
        }

        const $table = $(this);
        if (!$table.data('bsTable')) {
            const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
            const settings = $.extend(true, {}, $.bsTable.getDefaults(), $table.data() || {}, options);
            if (!settings.columns || !Array.isArray(settings.columns)) {
                settings.columns = [];
            }

            const bsTable = {
                settings: settings,
            };
            $table.data('bsTable', bsTable);
            buildTable($table);

            if (!$.bsTable.globalEventsBound) {
                registerGlobalTableEvents();
            }
        }

        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'showLoading': {
                    showLoading($table);
                }
                    break;
                case 'hideLoading': {
                    hideLoading($table);
                }
                    break;
                case 'refresh': {
                    const arg = args.length ? args[0] : null;
                    refresh($table, arg);
                }
                    break;
                case 'refreshOptions': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object') {
                        const setup = getSettings($table);
                        $.extend(true, setup, arg);
                        setSettings($table, setup);
                        refresh($table);
                    }
                }
                    break;
                case 'getSettings': {
                    return getSettings($table);
                }
                    break;
                case 'setCaption': {
                    const arg = args.length ? args[0] : null;
                    setCaption($table, arg);
                }
                    break;
            }
        }

        return $table;
    };

    function setCaption($table, stringOrObject) {
        const settings = getSettings($table);
        let caption = $table.find('caption:first');
        const isEmpty = isValueEmpty(stringOrObject);
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
            // Entferne alle vorhandenen Klassen aus dem Element
            caption.attr('class', '');

            settings.classes.caption.split(' ').forEach(className => {
                const classNameCheck = className.trim();
                if (!isValueEmpty(classNameCheck)) {
                    captionClasses.push(classNameCheck);
                }
            });

            // Füge die neue Klasse hinzu
            caption.addClass(captionClasses.join(' '));
        }
    }

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
            showLoading($table);
        }

        fetchData($table, triggerRefresh)
            .then(() => {
                triggerEvent($table, 'load-success', $table.data('response'));
                executeFunction(settings.onLoadSuccess, $table.data('response'));
                renderTable($table);
            })
            .catch(error => {
                console.error("Fehler beim Abrufen der Daten:", error);
            })
            .finally(() => {
                hideLoading($table);
            })
    }

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
                params.search = searchValue && !isValueEmpty(searchValue) ? searchValue : null;
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
                executeFunction(settings.onRefresh, params);
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

                    sortArrayByField(filteredData, params.sort, params.order);

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
                    const responseAfter = executeFunction(settings.responseHandler, responseBefore);

                    $table.data('response', responseAfter ?? responseBefore);
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
                    const responseAfter = executeFunction(settings.responseHandler, responseBefore);

                    $table.data('response', responseAfter ?? responseBefore);
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
                const responseAfter = executeFunction(settings.responseHandler, responseBefore);

                $table.data('response', responseAfter ?? responseBefore);
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

                            const responseAfter = executeFunction(settings.responseHandler, processedResponse);
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

                                const responseAfter = executeFunction(settings.responseHandler, processedResponse);
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
                        // `url` ist eine tatsächliche URL und kein Funktionsname
                        $.ajax({
                            url: settings.url,
                            method: "GET",
                            data: params,
                            dataType: "json"
                        })
                            .done(response => {
                                const processedResponse = Array.isArray(response)
                                    ? {rows: response, total: response.length}
                                    : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von String-URL erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = executeFunction(settings.responseHandler, processedResponse);
                                $table.data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .fail((xhr, status, error) => {
                                if (settings.debug) {
                                    console.error("Fehler bei der API-Abfrage (String-URL):", status, error); // DEBUG
                                }
                                reject(new Error(`Fehler bei der API-Abfrage (String-URL): ${status}, ${error}`));
                            });
                    }
                }
            }
        });
    }

    /**
     * Sortiert ein Array basierend auf einem Feld und einer Sortierreihenfolge.
     *
     * @param {Array} data - Das Array, das sortiert werden soll.
     * @param {string} field - Der Name des Feldes, nach dem sortiert werden soll.
     * @param {string} order - Die Sortierreihenfolge: "ASC" (aufsteigend) oder "DESC" (absteigend).
     * @return {Array} - Das sortierte Array.
     */
    function sortArrayByField(data, field, order = "ASC") {
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
    }

    function buildTable($table) {
        $table.empty(); // Tabelle leeren
        const settings = getSettings($table);
        // Erstelle den Haupt-Wrapper
        const wrapperId = generateRandomWrapperId();
        const $wrapper = $('<div>', {
            class: wrapperClass + ' position-relative',
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
                if (!isValueEmpty(name)) {
                    tableClasses.push(className);
                }
            });
        } else if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('table')) {
            settings.classes.table.split(' ').forEach(className => {
                const name = className.trim();
                if (!isValueEmpty(name)) {
                    tableClasses.push(className);
                }
            });
        }
        $table.addClass(tableClasses.join(' '));
        $table.appendTo($wrapper);
        setCaption($table, settings.caption);

        // **Neuer Table-Top-Container inkl. Pagination und Suche**
        const $tableTopContainer = buildTableTop($table).prependTo($wrapper);
        const $tableBottomContainer = buildTableBottom($table).appendTo($wrapper);

        $('<thead></thead>').appendTo($table);
        $('<tbody></tbody>').appendTo($table);
        $('<tfoot></tfoot>').appendTo($table);

        refresh($table)
    }

    function buildTableBottom($table) {
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
            <div class="d-flex flex-column ${gapClass}" data-role="tableBottomContainer">
                <div class="d-flex justify-content-between align-items-start ${flexClass}">
                    <div class="${wrapperPaginationDetailsClass}"></div>
                    <div class="${wrapperPaginationClass} bottom"></div>
                </div>
            </div>`;
        return $(template);
    }

    function buildTableTop($table) {
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
            <div class="d-flex flex-column ${gapClass}" data-role="tableTopContainer">
                <div class="d-flex justify-content-end align-items-end">
                    <div class="d-flex bs-table-toolbar me-auto">
                    </div>
                    <div class="d-flex ${wrapperSearchClass}">
                    </div>
                    <div class="btn-group bs-table-buttons">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-end ${flexClass}">
                    <div class="${wrapperPaginationDetailsClass}"></div>
                    <div class="${wrapperPaginationClass} top"></div>
                </div>
            </div>`;

        // Top Container bestehend aus 1-n Zeilen
        const $tableTopContainer = $(template);
        const $toolbarContainer = $tableTopContainer.find('.bs-table-toolbar');
        const $searchWrapper = $tableTopContainer.find('.' + wrapperSearchClass);
        const $btnContainer = $tableTopContainer.find('.bs-table-buttons');


        // Falls ein Toolbar-Element definiert ist, füge dieses in die erste Zeile und
        // setze margin end auf auto, damit sie links zentriert ist
        if (settings.toolbar && $(settings.toolbar).length > 0) {
            $(settings.toolbar).prependTo($toolbarContainer);
        }

        // Such-Wrapper erstellen (links)
// Falls die Suche aktiviert ist, füge ein Input-Feld und Logik hinzu
        if (settings.search === true) {
            const placeholder = executeFunction(settings.formatSearch)
            const $searchInputGroup = $(`
    <div class="input-group">
        <span class="input-group-text"><i class="${settings.icons.search}"></i></span>
        <input type="search" class="form-control ${inputSearchClass}" placeholder="${placeholder}">
    </div>
`);
            $searchInputGroup.appendTo($searchWrapper);
        }

        if (settings.showRefresh) {
            const $refreshButton = $(`<button>`, {
                class: 'btn btn-secondary',
                html: `<i class="${settings.icons.refresh}"></i>`,
                title: 'Refresh',
                'data-role': 'refresh',
            }).appendTo($btnContainer);
        }


        return $tableTopContainer;
    }

    function hideLoading($table) {
        const $overlay = getOverlay($table);
        if (!$overlay.length) return; // Abbruch, falls kein Overlay vorhanden ist

        // Vorherige Animation stoppen und sanftes Ausblenden starten
        $overlay.stop().animate({opacity: 0}, 100, function () {
            // Nach dem Ausblenden das Overlay vollständig entfernen
            $(this).remove();
        });
    }

    function showLoading($table) {
        const settings = getSettings($table);

        const wrapper = getWrapper($table);
        // Vorhandenes Overlay entfernen, falls vorhanden
        hideLoading($table);

        // Overlay generieren
        const $overlay = $('<div>', {
            class: wrapperOverlayClass + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-body',
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
    }

    function renderTable($table) {
        const settings = getSettings($table);
        if (settings.debug) {
            console.groupCollapsed("Render Table");
        }
        const wrapper = getClosestWrapper($table);
        const response = $table.data('response') || {rows: [], total: 0};
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
            buildTableHeader($table);
            buildTableBody($table, currentPageData);
            buildTableFooter($table, response.rows);
        }

        const $topPaginationContainer = getPaginationContainer($table, true).empty();
        const $bottomPaginationContainer = getPaginationContainer($table, false).empty();
        createPaginationDetails($table, totalRows);
        // $paginationDetails.appendTo();
        const $tableTopContainer = getTableTopContainer($table);
        const $btnContainer = $tableTopContainer.find('.bs-table-buttons:first');
        if (isValueEmpty(settings.pageList) || settings.pagination === false || pageSize === 0) {
            $btnContainer.find('[data-role="tablePaginationPageSize"]:first').remove();
        } else {
            const $pageListDropdown = buildPagelistDropdown($table, totalRows);
            if ($btnContainer.find('[data-role="tablePaginationPageSize"]:first').length > 0) {
                $btnContainer.find('[data-role="tablePaginationPageSize"]:first').replaceWith($pageListDropdown);
            } else {
                $pageListDropdown.prependTo($btnContainer);
            }
        }
        if (settings.showColumns === true) {
            const $columnSwitch = buildColumnVisibilityDropdown($table);
            if ($btnContainer.find('[data-role="tableColumnVisibility"]:first').length > 0) {
                $btnContainer.find('[data-role="tableColumnVisibility"]:first').replaceWith($columnSwitch);
            } else {
                $columnSwitch.prependTo($btnContainer);
            }
        }

        if ($btnContainer.find('.btn').length && settings.search === true) {
            // haben wir buttons und ein suchfeld, packe margin hinzu
            $btnContainer.addClass('ms-2');
        } else {
            // andernfalls entferne den margin
            $btnContainer.removeClass('ms-2');
        }

        if (settings.pagination && pageSize !== 0) {
            const $wrapper = getWrapper($table);

            const $paginationHtml = createPagination($table, totalRows);


            if (settings.paginationVAlign === 'top' || settings.paginationVAlign === 'both') {
                // $topPaginationContainer.append($paginationDetailHtml);
                $topPaginationContainer.append($paginationHtml.clone());
            }

            if (settings.paginationVAlign === 'bottom' || settings.paginationVAlign === 'both') {
                $bottomPaginationContainer.append($paginationHtml.clone());
            }
        }


    }

    function createPaginationDetails($table, totalRows) {
        const settings = getSettings($table);
        const wrapper = getClosestWrapper($table);
        // Berechnung der Anzeige-Daten (Start- und Endzeilen)
        const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
        const currentPage = settings.pageNumber || 1;
        const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endRow = Math.min(totalRows, currentPage * pageSize);


        // Textanzeige: "Showing x to y of total rows"
        const text = executeFunction(settings.formatShowingRows, startRow, endRow, totalRows);
        const $paginationText = $('<div>')
            .html(`<div class="">${text}</div>`);

        const $allDestinations = wrapper.find('.bs-table-pagination-details');
        console.log('Gefundene Elemente:', $allDestinations.length);

        if ($allDestinations.length > 0) {
            const $first = $allDestinations.first().empty();
            const $last = $allDestinations.last().empty();

            // Beispiel: Append zu beiden
            $paginationText.clone().appendTo($first);
            $paginationText.clone().appendTo($last);

            console.log('First Element:', $first);
            console.log('Last Element:', $last);
        } else {
            console.warn('Keine .bs-table-pagination-details gefunden.');
        }
    }

    function buildPagelistDropdown($table, totalRows) {
        const settings = getSettings($table);
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
        }).html((pageSize === totalRows ? 'All' : pageSize) + ' <i class="bi bi-arrows-vertical"></i>');

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
    }

    function buildColumnVisibilityDropdown($table) {
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

            // Erstelle ein Menü-Item mit Checkbox
            const $menuItem = $('<div>', {'class': 'dropdown-item px-3'}).append(
                $('<div>', {'class': 'form-check d-flex align-items-center'}).append(
                    $('<input>', {
                        'class': 'form-check-input me-2', // Abstand zur Checkbox hinzufügen
                        'type': 'checkbox',
                        'id': `columnVisibility-${colIndex}`,
                        'data-column-index': colIndex,
                        'checked': isVisible
                    }).on('change', function (e) {
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
                        'for': `columnVisibility-${colIndex}`
                    })
                        .text(column.title || column.field || `Column ${colIndex + 1}`)
                        .on('click', function (e) {
                            e.preventDefault(); // Verhindert das Schließen des Dropdowns
                            const $checkbox = $(`#columnVisibility-${colIndex}`); // Checkbox anhand der ID finden
                            $checkbox.prop('checked', !$checkbox.is(':checked')).trigger('change'); // Checkbox toggeln und Change-Event auslösen
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
    }

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

    function createPagination($table, totalRows) {
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
        const visiblePages = calculateVisiblePages(totalPages, currentPage);

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
    }

    function calculateVisiblePages(totalPages, currentPage) {
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
    }

    function buildTableHeader($table) {
        const settings = getSettings($table);
        const columns = settings.columns || [];
        // Prüfen, ob irgendeine Spalte das Attribut `checkbox` auf `true` hat.
        const hasCheckbox = columns.some(column => column.checkbox === true);

        const headerClasses = [];
        if (settings.showHeader === false) {
            headerClasses.push('d-none')
        }
        if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('thead')) {
            settings.classes.thead.split(' ').forEach(className => {
                const name = className.trim();
                if (!isValueEmpty(name)) {
                    headerClasses.push(className);
                }
            });
        }

        const $thead = $table.children('thead').empty().addClass(headerClasses.join(' '));
        const $tr = $('<tr></tr>').appendTo($thead);
        if (showCheckItem($table)) {
            buildCheckboxOrRadio($table, $tr, null)
        }

        if (columns && columns.length) {
            let colIndex = 0;
            columns.forEach(column => {
                if (column.checkbox === true || column.radio === true) return;
                const html = [
                    `<div class="d-flex align-items-center justify-content-between">`,
                    `<span class="flex-fill me-1">${column.title ?? ''}</span>`,
                ];
                if (column.sortable === true) {
                    html.push(`<span><i class="bs-table-icon"></i></span>`);
                }
                html.push(`</div>`);
                const order = column.field === settings.sortName ? settings.sortOrder ?? '' : '';
                const $th = $('<th>', {
                    'data-sortable': column.sortable === true ? 'true' : 'false',
                    'data-field': column.field,
                    'data-order': order,
                    'data-col-index': colIndex,
                    html: html.join('')
                }).appendTo($tr);
                if (column.sortable === true) {
                    $th.css('cursor', 'pointer');
                }

                const icon = getIconBySortOrder($table, order);
                $th.find('.bs-table-icon').addClass(icon);

                if (column.width) {
                    $th.css('width', column.width);
                }
                const classList = [];
                if (column.halign) {
                    let align = null;
                    if (['end', 'right'].includes(column.halign)) {
                        align = 'end';
                    }
                    if (['start', 'left'].includes(column.halign)) {
                        align = 'start';
                    }
                    if (['center', 'middle'].includes(column.halign)) {
                        align = 'center';
                    }
                    if (null !== align) {
                        classList.push('text-' + align);
                    }
                }

                if (column.visible === false) {
                    classList.push('d-none');
                }
                if (classList.length) {
                    $th.addClass(classList.join(' '));
                }
                colIndex++;
            })
        }
    }

    function getIconBySortOrder($table, sortOrder) {
        const settings = getSettings($table);
        if (sortOrder === 'asc') {
            return settings.icons.sortAsc;
        }
        if (sortOrder === 'desc') {
            return settings.icons.sortDesc;
        }
        return settings.icons.sortNone;
    }

    function buildTableFooter($table, data) {
        const settings = getSettings($table);
        const columns = settings.columns || [];

        const footerClasses = [];
        if (settings.showFooter === false) {
            footerClasses.push('d-none')
        }
        if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tfoot')) {
            settings.classes.tfoot.split(' ').forEach(className => {
                const classNameTrimmed = className.trim();
                if (!isValueEmpty(classNameTrimmed)) {
                    footerClasses.push(classNameTrimmed);
                }
            })
        }

        const $tfoot = $table.children('tfoot').empty().addClass(footerClasses.join(' '));
        const $tr = $('<tr></tr>').appendTo($tfoot);
        if (showCheckItem($table)) {
            $('<th></th>').appendTo($tr);
        }

        if (columns && columns.length) {
            let colIndex = 0;
            columns.forEach(column => {
                if (column.checkbox === true || column.radio === true) return;
                let value = '';
                const formatterValue = executeFunction(column.footerFormatter, data)
                if (!isValueEmpty(formatterValue)) {
                    value = formatterValue;
                }
                const $th = $('<th>', {
                    html: value,
                    'data-col-index': colIndex
                }).appendTo($tr);

                const classList = [];

                if (column.falign) {
                    let align = null;
                    if (['end', 'right'].includes(column.falign)) {
                        align = 'end';
                    }
                    if (['start', 'left'].includes(column.falign)) {
                        align = 'start';
                    }
                    if (['center', 'middle'].includes(column.falign)) {
                        align = 'center';
                    }
                    if (null !== align) {
                        classList.push('text-' + align);
                    }
                }

                if (column.visible === false) {
                    classList.push('d-none');
                }
                if (classList.length) {
                    $th.addClass(classList.join(' '));
                }
                colIndex++;
            })
        }

        // Nur die Daten der aktuellen Seite an onPostFooter übergeben
        triggerEvent($table, 'post-footer', $tfoot, $table);
        executeFunction(settings.onPostFooter, $tfoot, $table);
    }

    /**
     * Executes a given function or a function referenced by its name in the global `window` context.
     *
     * @param {Function|string} functionOrName The function to execute or the name of a function in the global scope.
     * @param {...*} args The arguments to pass to the function when it is executed.
     * @return {*} Returns the result of executing the function if it is valid, or null if the function execution failed.
     */
    function executeFunction(functionOrName, ...args) {
        if (!functionOrName) {
            // console.warn("No function has been passed or the name is not defined.");
            return null;
        }

        if (typeof functionOrName === 'function') {
            // Direkte Funktionsreferenz
            return functionOrName(...args);
        }

        if (typeof functionOrName === 'string' && typeof window[functionOrName] === 'function') {
            // Funktionsname im globalen `window`-Kontext
            return window[functionOrName](...args);
        }

        // console.warn(`"${functionOrName}" is neither a function nor a valid function name.`);
        return null;
    }

    function buildTableBody($table, rows) {
        const settings = getSettings($table);
        // Nur die Daten der aktuellen Seite an onPostBody übergeben
        triggerEvent($table, 'pre-body', rows, $table);
        executeFunction(settings.onPreBody, rows, $table);
        const hasColumns = settings.columns && settings.columns.length;
        const columns = hasColumns ? settings.columns : [];
        const hasCheckbox = columns.some(column => column.checkbox === true);
        const $tbody = $table.children('tbody').empty();

        let bodyClasses = [];
        if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tbody')) {
            settings.classes.tbody.split(' ').forEach(className => {
                const classNameTrimmed = className.trim();
                if (!isValueEmpty(classNameTrimmed)) {
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
                $tr.data('row', row);
                executeFunction(settings.rowStyle, row, trIndex, $tr);
                if (hasColumns) {
                    if (showCheckItem($table)) {
                        buildCheckboxOrRadio($table, $tr, row)
                    }
                    let colIndex = 0;
                    settings.columns.forEach(column => {
                        if (column.checkbox === true || column.radio === true) return;
                        buildTableBodyTd(column, row, $tr, colIndex);
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
        executeFunction(settings.onPostBody, rows, $table);
    }

    function buildCheckboxOrRadio($table, $tr, row = null) {
        const settings = getSettings($table);
        const defaultIdField = settings.idField;
        const columns = settings.columns;
        const forHeader = isValueEmpty(row);

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
            id: generateRandomWrapperId(`bs_table_${inputType}_`),
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

    function buildTableBodyTd(column, row, $tr, colIndex) {
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

            if (column.width) {
                $td.css('width', column.width);
            }

            if (column.visible === false) {
                $td.addClass('d-none');
            }

            $td.data('column', column);
            // $td.data('row', row);
            $td.data('trIndex', trIndex);

            let value = row[column.field] ?? ' - ';
            const valueFormatter = executeFunction(column.formatter, value, row, trIndex, $td);
            if (!isValueEmpty(valueFormatter)) {
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
    }

    function getSettings($table) {
        return $table.data('bsTable').settings;
    }

    function getWrapper($table) {
        return $table.closest(`.${wrapperClass}`);
    }

    function getClosestWrapper($element) {
        return $element.closest(`.${wrapperClass}`);
    }

    function getClosestWrapperId($element) {
        return $element.closest(`.${wrapperClass}`).attr('id');
    }

    function getTableBottomContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        return $wrapper.children(`[data-role="tableBottomContainer"]`).first();
    }

    function getTableTopContainer($table) {
        const $wrapper = getWrapper($table);
        return $wrapper.children(`[data-role="tableTopContainer"]`).first();
    }

    function getPaginationContainer($table, top) {
        if (top) {
            return getTableTopContainer($table).find('.' + wrapperPaginationClass);
        } else {
            return getTableBottomContainer($table).find('.' + wrapperPaginationClass);
        }
    }

    function getPaginationDetailsContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        // Finde den Pagination-Container und stelle sicher, dass er direkt zum aktuellen Wrapper gehört
        const $pagination = $wrapper.find(`.${wrapperPaginationDetailsClass}`).filter(function () {
            // Überprüfe, ob der Pagination-Container direkt dem aktuellen Wrapper zugeordnet ist
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Hole nur den ersten passenden Pagination-Container

        return $pagination.length > 0 ? $pagination : $(); // Fallback: Leeres jQuery-Objekt, wenn keiner gefunden
    }

    function getSearchInput($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper

        // Finde den einzigen Such-Input im Wrapper, aber ignoriere Inputs aus untergeordneten Wrappers
        const $searchInput = $wrapper.find('.' + inputSearchClass).filter(function () {
            // Stelle sicher, dass der Input direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur den ersten gefilterten Input holen (falls mehr als einer gefunden wird)

        return $searchInput.length > 0 ? $searchInput : $(); // Fallback: leeres jQuery-Objekt, falls nichts gefunden
    }

    function generateRandomWrapperId(prefix = "bs_table_wrapper_") {

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
        const $overlay = $wrapper.find('.' + wrapperOverlayClass).filter(function () {
            // Überprüfe, ob dieses Overlay direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur das erste Overlay holen (falls mehrere gefunden werden)

        return $overlay.length > 0 ? $overlay : $(); // Fallback: leeres jQuery-Objekt, falls kein Overlay gefunden wurde
    }

    function setSettings($table, settings) {
        const data = $table.data('bsTable');
        if (data) {
            data.settings = settings;
        }
        $table.data('bsTable', data);
    }


    /**
     * Checks if the given value is empty. A value is considered empty if it is:
     * - null
     * - undefined
     * - an empty array
     * - a string containing only whitespace characters
     *
     * @param {*} value - The value to be checked for emptiness.
     * @return {boolean} - Returns `true` if the value is empty, otherwise `false`.
     */
    function isValueEmpty(value) {
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
        executeFunction(settings.onSort, settings.sortName, settings.sortOrder);
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
        executeFunction(settings.onClickRow, row, $tr, column.field);
        triggerEvent($table, 'click-cell', column.field, value, row, $td);
        executeFunction(settings.onClickCell, column.field, value, row, $td);
        if (settings.clickToSelect === true) {
            if (showCheckItem($table)) {
                const checkbox = $tr.find('td[data-role="tableCellCheckbox"]:first input');
                checkbox.prop('checked', !checkbox.prop('checked')).trigger('change.bs.table');
            }
        }
    }

    function triggerEvent($table, eventName, ...args) {
        const targetTable = $table[0];
        const settings = getSettings($table);
        const isSubTable = $table.closest(`.${wrapperClass}[data-child="true"]`).length > 0;
        const hasSubTables = getClosestWrapper($table).find(`.${wrapperClass}[data-child="true"]`).length > 0;
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

        // Globales "all.bs.table"-Event
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
        const response = $table.data('response');
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
            executeFunction(settings.onCheck, row, $checkbox);
        } else {
            triggerEvent(table, 'uncheck', row, $checkbox);
            executeFunction(settings.onUncheck, row, $checkbox);
        }
        $tr.toggleClass('table-active');
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

        table.find('[data-role="tableRadio"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                const radioTr = radio.closest('tr');
                radioTr.removeClass('table-active');
                if (radio.is(':checked')) {
                    radioTr.addClass('table-active');
                    triggerEvent(table, 'check', radioTr.data('row'), radio);
                    executeFunction(settings.onCheck, radioTr.data('row'), radio);
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
        table.find('[data-role="tableCheckbox"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                radio.prop('checked', isChecked);
                if (isChecked) {
                    radio.closest('tr').addClass('table-active');
                } else {
                    radio.closest('tr').removeClass('table-active');
                }
            }
        });
        if (isChecked) {
            triggerEvent(table, 'check-all');
            executeFunction(settings.onCheckAll);
        } else {
            triggerEvent(table, 'uncheck-all');
            executeFunction(settings.onUncheckAll);
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
        table.find('[data-role="tableRadio"]').each(function (_, el) {
            const radio = $(el);
            if (getClosestWrapper(radio)[0] === wrapper[0]) {
                radio.prop('checked', false);
                radio.closest('tr').removeClass('table-active');
            }
        });
        triggerEvent(table, 'uncheck-all');
        executeFunction(settings.onUncheckAll);
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
            ].join(' '), '.' + wrapperClass, function (e) {
                const $target = $(e.currentTarget);

                // Stelle sicher, dass nur das äußerste Element Events erhält
                if ($target.parents('.' + wrapperClass).length > 0) {
                    return; // Ignoriere verschachtelte `wrapperClass`
                }

                // Events für das äußere `.wrapperClass` registrieren
                // Je nach Ereignistyp kannst du hier differenzieren, falls nötig.
            })
            .on([
                'click' + namespace,
                'change' + namespace,
                'touchstart' + namespace,
                'mouseenter' + namespace,
            ].join(' '), `.${wrapperClass} [data-child="true"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            })
            .on('click' + namespace, `.${wrapperClass} tbody > tr > td`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $td = $(e.currentTarget);
                onClickCellAndRow($td);
            })
            .on('change' + namespace, `.${wrapperClass} thead [data-role="tableHeaderRadio"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleUncheckRadios($checkbox);
            })
            .on('change' + namespace, `.${wrapperClass} thead [data-role="tableHeaderCheckbox"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleCheckOnOrNone($checkbox);
            })
            .on('change' + namespace, `.${wrapperClass} table tbody [data-role="tableRadio"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleRadiosByRadioChange($checkbox);
            })
            .on('change' + namespace, `.${wrapperClass} tbody [data-role="tableCheckbox"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $checkbox = $(e.currentTarget);
                handleCheckboxChange($checkbox);
            })
            .on('click' + namespace, `.${wrapperClass} thead th[data-sortable="true"]`, function (e) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $th = $(e.currentTarget);
                handleSortOnTheadTh($th);
            })
            .on('click' + namespace, `.${wrapperClass} [data-role="tablePaginationPageSize"] .dropdown-item`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $a = $(e.currentTarget);
                if (!$a.length) return;
                const wrapper = getClosestWrapper($a);
                const table = getTableByWrapperId(wrapper.attr('id'));
                handleClickOnPaginationSize(table, $a);
            })
            .on('click' + namespace, `.${wrapperClass} [data-role="refresh"]`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $btn = $(e.currentTarget);
                if (!$btn.length) return;
                const $wrapper = getClosestWrapper($btn);
                const table = getTableByWrapperId($wrapper.attr('id'));
                refresh(table, null, true);
            })
            .on('input' + namespace, `.${wrapperClass} .${inputSearchClass}`, function (e) {
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
            .on('click' + namespace, `.${wrapperClass} .${wrapperPaginationClass} .page-link`, function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const $pageLink = $(e.currentTarget);
                if (!$pageLink.length) return;
                const wrapper = getClosestWrapper($pageLink);
                const table = getTableByWrapperId(wrapper.attr('id'));
                const settings = getSettings(table);
                const response = table.data('response') || {rows: [], total: 0};
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
