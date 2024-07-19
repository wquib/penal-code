// Definition
var playerName = 0;
let jailtime_total = 0;
let fine_total = 0;
let bail_total = 0;
let max_jailtime = 480;
let max_fine = 10000;
let max_bail = 25000;

let addedChargeData = [];
let chargeData = [];

async function loadTableData() {
    const response = await fetch('data.json');
    chargeData = await response.json();

    const tableBody = document.getElementById('chargeTableBody');
    tableBody.innerHTML = '';

    chargeData.forEach((item, index) => {
        var code = splitChargeCode(item.charge).Code;
        var charge = splitChargeCode(item.charge).Charge;
        var fineFormat = parseFloat(item.fine).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        var bailFormat = parseFloat(item.bail).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        const row = document.createElement('tr');

        row.innerHTML = `
            <td hidden translate="no">${index}</td>
            <td hidden translate="no">${item.code}</td>
            <td translate="no" onclick="copyPureCharge(${index})" class="selectable-text">${code}</td>
            <td translate="no">${charge} 
                <a href="https://police.san-andreas.net/viewtopic.php?t=148639#:~:text=${code}" target="_blank" rel="noopener noreferrer">
                    <i class="bi bi-link-45deg"></i>
                </a>
            </td>
            <td translate="no">${item.jailtime}</td>
            <td translate="no">${fineFormat}</td>
            <td translate="no">${bailFormat}</td>
            <td><button onclick="AddCharge(${index})" class="btn btn-primary add-btn" id="add-btn-${index}">ADD</button></td>
        `;
        
        tableBody.appendChild(row);
    });
    loadChargeTable();
}

// Call that function while the page loaded
document.addEventListener('DOMContentLoaded', loadTableData);

// load the added charge table from session
async function loadChargeTable() {
    if(sessionStorage.getItem('addedCharge') === null) return;

    // Merging addedcCharge session variable to local var
    let retrievedChargeString = sessionStorage.getItem('addedCharge');
    let retrievedCharge = JSON.parse(retrievedChargeString);    
    addedChargeData = retrievedCharge;
    
    for (let i = 0; i < addedChargeData.length; i++) {
        const element = addedChargeData[i];
        AddCharge(element, false);
    }
}

// Add Charge
function AddCharge(index, button = true) {
    var buttonId = 'add-btn-' + index;
    var add_button = document.getElementById(buttonId);
    add_button.disabled = true;

    const item = chargeData[index];
    const selectedRows = document.querySelectorAll('.index');
    for (const row of selectedRows) {
        const selectedIndex = parseFloat(row.textContent);
        if (selectedIndex === index) {
            console.log('Data sudah ada di tabel seleksi.');
            return;
        }
    }

    const selectedTableBody = document.getElementById('selectedChargeTableBody');
    var selectedRow = document.createElement('tr');
    
    var code = splitChargeCode(item.charge).Code;
    var charge = splitChargeCode(item.charge).Charge;
    var fineFormat = parseFloat(item.fine).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    var bailFormat = parseFloat(item.bail).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    selectedRow.innerHTML = `
        <td translate="no" class="index" hidden>${index}</td>
        <td translate="no">${code}</td>
        <td translate="no" id="charge-${index}" onclick="copyCharge(${index})" class="selectable-text charge-td">${charge}</td>
        <td translate="no" class="jailtime">${item.jailtime}</td>
        <td translate="no" class="fine">${fineFormat}</td>
        <td translate="no" class="bail">${bailFormat}</td>
        <td>
            <button onclick="copyCharge(${index})" class="btn btn-secondary me-2">COPY</button>
            <button onclick="removeCharge(this, '${index}')" class="btn btn-danger">REMOVE</button>
        </td>
    `;

    // Add the data to session while issued by add button
    if (button === true) {
        addedChargeData.push(index);    
        let addedChargeString = JSON.stringify(addedChargeData);
        sessionStorage.setItem('addedCharge', addedChargeString);
    }

    selectedTableBody.appendChild(selectedRow);
    refreshData();
}

function removeCharge(button, index) {
    let data = parseInt(index, 10)
    addedChargeData = addedChargeData.filter(value => value !== data);

    if(addedChargeData.length > 0) {
        let addedChargeString = JSON.stringify(addedChargeData);
        sessionStorage.setItem('addedCharge', addedChargeString);
    } else {
        sessionStorage.removeItem('addedCharge');
    }

    var buttonId = 'add-btn-' + index;
    var add_button = document.getElementById(buttonId);
    add_button.disabled = false;

    const row = button.closest('tr');
    row.remove();
    refreshData();
}

function resetCharge() {
    const add_button = document.querySelectorAll('.add-btn');
    add_button.forEach(function(button) {
        if (button.disabled === true) {
            button.disabled = false;
        }
    });

    // reset the added charge session data
    addedChargeData = [];
    sessionStorage.removeItem('addedCharge');

    const selectedTableBody = document.getElementById('selectedChargeTableBody');
    selectedTableBody.innerHTML = '';
    refreshData();
}

function refreshData() {
    jailtime_total = 0;
    fine_total = 0;
    bail_total = 0;

    // Jailtime total
    const jailtime_elements = document.querySelectorAll('.jailtime');
    jailtime_elements.forEach(element => {
        jailtime_total += parseInt(element.textContent, 10);
    });
    if(jailtime_total > max_jailtime) jailtime_total = max_jailtime;
    document.getElementById('jailtime-total').textContent = jailtime_total;

    // Fine total
    const fine_elements = document.querySelectorAll('.fine');
    fine_elements.forEach(element => {
        const value = parseFloat(element.textContent.replace('$', '').replace(',', ''));
        fine_total += value;
    });
    if(fine_total > max_fine) fine_total = max_fine;
    document.getElementById('fine-total').textContent = `${fine_total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
    
    // Bail total
    const bail_elements = document.querySelectorAll('.bail');
    bail_elements.forEach(element => {
        const value = parseFloat(element.textContent.replace('$', '').replace(',', ''));
        bail_total += value;
    });
    if(bail_total > max_bail) bail_total = max_bail;
    document.getElementById('bail-total').textContent = `${bail_total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;

    // Formatting arrest command
    const arrestCommand = `/arrest ${playerName} ${jailtime_total} ${fine_total} ${bail_total}`;
    document.getElementById('arrest-command').textContent = arrestCommand;
}

function updateName(value) {
    if (typeof value === 'string') {
        playerName = value.replace(/ /g, "_");
    } else {
        playerName = value;
    }
    const arrestCommand = `/arrest ${playerName} ${jailtime_total} ${fine_total} ${bail_total}`;
    document.getElementById('arrest-command').textContent = arrestCommand;
}

document.addEventListener('DOMContentLoaded', function () {
    var playerInput = document.getElementById('playerName');

    playerInput.addEventListener('input', function () {
        var inputValue = playerInput.value.trim();
        if(inputValue === "") {
            inputValue = 0;
        }
        updateName(inputValue);
    });
});

// Charge click and copy with /su format
function copyCharge(index) {
    var originalText = document.getElementById(`charge-${index}`);
    let data = chargeData[index];
    
    const additionalText = `/su ${playerName} ${data.charge}`;
    
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = additionalText;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    try {
        document.execCommand('copy');
        originalText.classList.add('fw-bold');
    } catch (err) {
        console.error('Failed to copy text', err);
    }
    document.body.removeChild(tempTextarea);
}

function copyPureCharge(index) {
    let data = chargeData[index];
    var tempInput = document.createElement('textarea');
    tempInput.value = data.charge;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        alert('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function copyArrestCMD() {
    var arrestText = document.getElementById('arrest-command').innerText.trim();
    var tempInput = document.createElement('textarea');
    tempInput.value = arrestText;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        alert('Failed to copy text', err);
    }
    document.body.removeChild(tempInput);
}

function splitChargeCode(input) {
    const regex = /^\((\d+)\) ([A-Z]\.)/;
    const match = input.match(regex);
    
    if (match) {
        const code = match[0];
        const charge = input.replace(code, '').trim();
        return {
            Code: code,
            Charge: charge
        };
    } else {
        return {
            error: 'Input format is incorrect'
        };
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const itemTable = document.getElementById("chargeTable");
    const rows = itemTable.getElementsByTagName("tr");

    searchInput.addEventListener("keyup", function () {
        const filter = searchInput.value.toLowerCase();

        for (let i = 1; i < rows.length; i++) {
            const hiddenCellText = rows[i].cells[1].textContent || rows[i].cells[1].innerText;
            const chargeCellText = rows[i].cells[2].textContent || rows[i].cells[2].innerText;
            const descriptionCellText = rows[i].cells[3].textContent || rows[i].cells[3].innerText;

            if (
                hiddenCellText.toLowerCase().indexOf(filter) > -1 ||
                chargeCellText.toLowerCase().indexOf(filter) > -1 ||
                descriptionCellText.toLowerCase().indexOf(filter) > -1
            ) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    const searchElement = document.getElementById('searchInput');
    const playerNameElement = document.getElementById('playerName');

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            searchElement.focus();
        }
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            playerNameElement.focus();
        }
    });
});