/* Yarin Ben Moshe 314939885
Amit Rahamim 318816535
Shahar Ben Naim 208628453 */

const DB_NAME = 'items_database';
        const DB_VERSION = 1;
        let db;
        // Initialize our IndexDB database
        async function initDatabase() {
            return new Promise((resolve, reject) => {
                const request = window.indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = (event) => {
                    console.error("Database error:", event.target.errorCode);
                    reject(event.target.errorCode);
                };
                
                request.onupgradeneeded = (event) => { 
                    const db = event.target.result;
                    const objectStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex('cost', 'cost', { unique: false });
                    objectStore.createIndex('description', 'description', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('year', 'year', { unique: false });
                    objectStore.createIndex('month', 'month', { unique: false });
                };

                request.onsuccess = (event) => {
                    db = event.target.result;
                    resolve(db);
                };
            });
        }

        // Add  an item to the table
        async function addItem( cost,description,category, year, month) {
            console.log("addItem Called")
            const transaction = db.transaction(['items'], 'readwrite');
            const objectStore = transaction.objectStore('items');

            return new Promise((resolve, reject) => {
                const request = objectStore.add({ cost ,description,category, year, month });

                request.onsuccess = () => {
                    resolve();
                    console.log("Added succesfully to the DB")
                };

                request.onerror = (event) => {
                    console.error("Error adding item:", event.target.error);
                    reject(event.target.error);
                };
            });
        }
        // Delete an item from the DB
        async function deleteItemById( id ) {
            console.log("deleteItem Called")
            console.log(id)
            const transaction = db.transaction(['items'], 'readwrite');
            const objectStore = transaction.objectStore('items');

            return new Promise((resolve, reject) => {
                const request = objectStore.delete(id);

                request.onsuccess = () => {
                    resolve();
                    console.log("Deleted succesfully to the DB")
                };

                request.onerror = (event) => {
                    console.error("Error adding item:", event.target.error);
                    reject(event.target.error);
                };
            });
        }

      

        async function getItemsByMonthAndYear(year, month) {
            const transaction = db.transaction(['items'], 'readonly');
            const objectStore = transaction.objectStore('items');
            const index = objectStore.index('year');
            const range = IDBKeyRange.only(year);
            const items = [];

            return new Promise((resolve, reject) => {
                index.openCursor(range).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.month === month) {
                            items.push(cursor.value);
                        }
                        cursor.continue();
                    } else {
                        resolve(items);
                    }
                };

                transaction.onerror = (event) => {
                    console.error("Error fetching items:", event.target.error);
                    reject(event.target.error);
                };
            });
        }

        async function getItemsByDateRange(startYear, startMonth, endYear, endMonth) {
            const transaction = db.transaction(['items'], 'readonly');
            const objectStore = transaction.objectStore('items');
            const index = objectStore.index('year'); // Assuming there is index existing in 'year'
            
            // Creating a range for years
            const yearRange = IDBKeyRange.bound(startYear, endYear);
            const items = [];
        
            return new Promise((resolve, reject) => {
                index.openCursor(yearRange).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const item = cursor.value;
                        const itemYear = item.year;
                        const itemMonth = item.month;
                        
                        // Now we manually check if the item falls within the start and end month of the start and end years.
                        if ((itemYear > startYear || (itemYear === startYear && itemMonth >= startMonth)) &&
                            (itemYear < endYear || (itemYear === endYear && itemMonth <= endMonth))) {
                            items.push(item);
                        }
                        cursor.continue();
                    } else {
                        resolve(items);
                    }
                };
        
                transaction.onerror = (event) => {
                    console.error("Error fetching items:", event.target.error);
                    reject(event.target.error);
                };
            });
        }

        const handleReportRange = async (startYear, startMonth, endYear, endMonth) => {
            const fetchedItems = await getItemsByDateRange(startYear, startMonth, endYear, endMonth);

          };

        // Here we do everything related to adding a new item
        async function handleAddItem() {
            const cost = document.getElementById('cost').value;
            const description = document.getElementById('description').value;
            const category = document.getElementById('category').value;
            const year = document.getElementById('year').value;
            const month = document.getElementById('month').value;

            try {
                await addItem(cost,description, year, month);
                console.log("Item added successfully!");
            } catch (error) {
                console.error("Failed to add item:", error);
            }
        }
        // Here we do everything related to the show report function/button
        async function handleShowReport() {
            const year = document.getElementById('reportYear').value;
            const month = document.getElementById('reportMonth').value;

            try {
                const items = await getItemsByMonthAndYear(year, month);
                const reportContainer = document.getElementById('reportContainer');
                reportContainer.innerHTML = ''; // Clear previous report

                if (items.length === 0) {
                    reportContainer.textContent = "No items found for the specified month and year.";
                } else { // Show the results
                    const ul = document.createElement('ul');
                    items.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = `Item: ${item.item}, Cost: ${item.cost}, Year: ${item.year}, Month: ${item.month}`;
                        ul.appendChild(li);
                    });
                    reportContainer.appendChild(ul);
                }
            } catch (error) {
                console.error("Failed to fetch items:", error);
            }
        }


        // async function getAllItems() {
        //     const transaction = db.transaction(['items'], 'readonly');
        //     const objectStore = transaction.objectStore('items');
        //     const items = [];
        
        //     return new Promise((resolve, reject) => {
        //         objectStore.openCursor().onsuccess = (event) => {
        //             const cursor = event.target.result;
        //             if (cursor) {
        //                 items.push(cursor.value);
        //                 cursor.continue();
        //             } else {
        //                 resolve(items);
        //             }
        //         };
        
        //         transaction.onerror = (event) => {
        //             console.error("Error fetching items:", event.target.error);
        //             reject(event.target.error);
        //         };
        //     });
        // }

        async function init() { // Initialize our database
            try {
                await initDatabase();
                console.log("Database initialized successfully!");
            } catch (error) {
                console.error("Failed to initialize database:", error);
            }
        }

        init();

        

        export {
            DB_NAME,
            DB_VERSION,
            initDatabase,
            addItem,
            getItemsByMonthAndYear,
            deleteItemById,
            handleAddItem,
            handleShowReport,
            init,
            handleReportRange,
            getItemsByDateRange
            
        };

        

        
