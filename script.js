loadProducts();
let imageFiles = [];

const selectedImages = new Map();
const quantities = new Map();

const table = document.getElementById("imageTable");
const tbody = table.querySelector("tbody");

const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const printBtn = document.getElementById("printBtn");
const totalModelCount = document.getElementById("totalModelCount");


// ============================================================
// UČITAVANJE BAZE IZ products.json
// ============================================================

async function loadProducts() {
    try {
        const response = await fetch("./products.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP greška: ${response.status}`);
        }

        imageFiles = await response.json();

        updateBrandFilter();
        renderTable();

    } catch (error) {
        console.error("Greška kod učitavanja products.json:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="color:red; text-align:center; padding:20px;">
                    Greška kod učitavanja baze proizvoda.<br>
                    Provjeri postoji li <strong>products.json</strong>
                    u istom folderu kao index.html.
                </td>
            </tr>
        `;
    }
}


// ============================================================
// BRAND FILTER
// ============================================================

function updateBrandFilter() {
    const currentValue = brandFilter.value;

    const brands = [...new Set(
        imageFiles.map(item => item.brand)
    )].sort((a, b) => a.localeCompare(b));

    brandFilter.innerHTML = `<option value="">Sve marke</option>`;

    brands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });

    if (brands.includes(currentValue)) {
        brandFilter.value = currentValue;
    }
}


// ============================================================
// FILTER + SEARCH
// ============================================================

function getFilteredImages() {
    const search = searchInput.value
        .trim()
        .toLowerCase();

    const brand = brandFilter.value;

    return imageFiles.filter(item => {

        const matchesSearch =
            !search ||
            item.model.toLowerCase().includes(search) ||
            item.filename.toLowerCase().includes(search) ||
            item.brand.toLowerCase().includes(search);

        const matchesBrand =
            !brand ||
            item.brand === brand;

        return matchesSearch && matchesBrand;
    });
}


// ============================================================
// RENDER TABLICE
// ============================================================

function renderTable() {

    tbody.innerHTML = "";

    const filteredImages = getFilteredImages();

    filteredImages.forEach(item => {

        const tr = document.createElement("tr");

        // ----------------------------------------------------
        // CHECKBOX
        // ----------------------------------------------------

        const checkboxTd = document.createElement("td");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        checkbox.checked = selectedImages.has(item.filename);

        checkbox.addEventListener("change", () => {

            if (checkbox.checked) {

                const quantity = quantities.get(item.filename) || 1;

                selectedImages.set(
                    item.filename,
                    quantity
                );

            } else {

                selectedImages.delete(item.filename);
            }

            updateCounter();
        });

        checkboxTd.appendChild(checkbox);


        // ----------------------------------------------------
        // MODEL
        // ----------------------------------------------------

        const modelTd = document.createElement("td");
        modelTd.textContent = item.model;


        // ----------------------------------------------------
        // BRAND
        // ----------------------------------------------------

        const brandTd = document.createElement("td");
        brandTd.textContent = item.brand;


        // ----------------------------------------------------
        // IMAGE LINK
        // ----------------------------------------------------

        const linkTd = document.createElement("td");

        const imagePath =
            `./print/${encodeURIComponent(item.folder)}/${encodeURIComponent(item.filename)}`;

        const link = document.createElement("a");

        link.href = imagePath;
        link.target = "_blank";
        link.textContent = "Slika";

        linkTd.appendChild(link);


        // ----------------------------------------------------
        // QUANTITY
        // ----------------------------------------------------

        const quantityTd = document.createElement("td");

        const quantityInput = document.createElement("input");

        quantityInput.type = "number";
        quantityInput.min = "1";
        quantityInput.max = "999";
        quantityInput.value =
            quantities.get(item.filename) || 1;

        quantityInput.style.width = "65px";
        quantityInput.style.textAlign = "center";

        quantityInput.addEventListener("input", () => {

            let quantity = parseInt(
                quantityInput.value,
                10
            );

            if (!Number.isFinite(quantity) || quantity < 1) {
                quantity = 1;
            }

            quantities.set(
                item.filename,
                quantity
            );

            if (selectedImages.has(item.filename)) {

                selectedImages.set(
                    item.filename,
                    quantity
                );
            }

            updateCounter();
        });

        quantityTd.appendChild(quantityInput);


        // ----------------------------------------------------
        // RED
        // ----------------------------------------------------

        tr.appendChild(checkboxTd);
        tr.appendChild(modelTd);
        tr.appendChild(brandTd);
        tr.appendChild(linkTd);
        tr.appendChild(quantityTd);

        tbody.appendChild(tr);
    });

    updateCounter();
}


// ============================================================
// COUNTER
// ============================================================

function updateCounter() {

    let total = 0;

    selectedImages.forEach(quantity => {
        total += quantity;
    });

    totalModelCount.textContent =
        `${selectedImages.size} označeno / ${total} naljepnica`;
}


// ============================================================
// SEARCH / FILTER EVENTS
// ============================================================

searchInput.addEventListener("input", renderTable);
brandFilter.addEventListener("change", renderTable);


// ============================================================
// PRINT
// ============================================================

printBtn.addEventListener("click", () => {

    if (selectedImages.size === 0) {
        alert("Nije odabran niti jedan artikl.");
        return;
    }

    const labels = [];

    selectedImages.forEach((quantity, filename) => {

        const item = imageFiles.find(
            product => product.filename === filename
        );

        if (!item) {
            return;
        }

        for (let i = 0; i < quantity; i++) {
            labels.push(item);
        }
    });

    if (labels.length === 0) {
        alert("Nema naljepnica za ispis.");
        return;
    }

    const printWindow = window.open(
        "",
        "_blank"
    );

    if (!printWindow) {
        alert(
            "Preglednik je blokirao popup prozor. " +
            "Dozvoli popup za ovu stranicu."
        );
        return;
    }


    // ========================================================
    // HTML ZA PRINT
    // ========================================================

    let pagesHtml = "";

    for (let i = 0; i < labels.length; i += 6) {

        const pageLabels = labels.slice(i, i + 6);

        pagesHtml += `
            <div class="page">
        `;

        pageLabels.forEach(item => {

            const imagePath =
                `./print/${encodeURIComponent(item.folder)}/${encodeURIComponent(item.filename)}`;

            pagesHtml += `
                <div class="label">
                    <img
                        src="${imagePath}"
                        alt="${escapeHtml(item.model)}"
                    >
                </div>
            `;
        });

        // Ako zadnja stranica nema 6 naljepnica,
        // popuni praznim poljima radi pravilnog rasporeda.

        while (pageLabels.length < 6) {

            pagesHtml += `
                <div class="label empty"></div>
            `;

            pageLabels.push(null);
        }

        pagesHtml += `
            </div>
        `;
    }


    printWindow.document.open();

printWindow.document.write(`
    <!DOCTYPE html>

    <html lang="hr">

    <head>

        <meta charset="UTF-8">

        <title>Print naljepnica</title>

        <style>

            @page {
                size: A4 landscape;
                margin: 0;
            }

            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                width: 297mm;
                height: 210mm;
            }

            body {
                background: white;
            }

            .page {

                width: 297mm;
                height: 210mm;

                display: grid;

                grid-template-columns:
                    repeat(3, 90mm);

                grid-template-rows:
                    repeat(2, 90mm);

                /* 0.2 cm = 2 mm */
                column-gap: 0mm;
                row-gap: 2mm;

                /* Center entire 3x2 group on A4 */
                justify-content: center;
                align-content: center;

                page-break-after: always;

                margin: 0;
                padding: 0;
            }

            .page:last-child {
                page-break-after: auto;
            }

            .label {

                width: 90mm;
                height: 90mm;

                display: flex;

                align-items: center;
                justify-content: center;

                overflow: hidden;

                margin: 0;
                padding: 0;
            }

            .label img {

                display: block;

                width: 90mm;
                height: 90mm;

                object-fit: contain;

                margin: 0;
                padding: 0;
            }

            .empty {
                visibility: hidden;
            }

        </style>

    </head>

    <body>

        ${pagesHtml}

        <script>

            window.onload = function() {

                setTimeout(function() {

                    window.print();

                }, 300);

            };

        <\/script>

    </body>

    </html>
`);

    printWindow.document.close();
});


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// GUMBI: VRH / DNO
// ============================================================

function createPageJumpButtons() {

    const container = document.createElement("div");

    container.id = "pageJumpButtons";

    container.innerHTML = `
        <button
            type="button"
            id="scrollTopBtn"
            title="Idi na vrh"
            aria-label="Idi na vrh"
        >
            ↑
        </button>

        <button
            type="button"
            id="scrollBottomBtn"
            title="Idi na dno"
            aria-label="Idi na dno"
        >
            ↓
        </button>
    `;

    document.body.appendChild(container);


    document.getElementById("scrollTopBtn")
        .addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });


    document.getElementById("scrollBottomBtn")
        .addEventListener("click", () => {

            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth"
            });

        });
}


// ============================================================
// START
// ============================================================

createPageJumpButtons();

loadProducts();