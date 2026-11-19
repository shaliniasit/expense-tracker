
const STORAGE_KEY = "smartExpenseTrackerTransactions";

const categoryColors = {
    Food: "#f28b45",
    Travel: "#3978d8",
    Shopping: "#d95d8c",
    Bills: "#49b77c",
    Other: "#7654bf"
};

const categoryIcons = {
    Food: "🍔",
    Travel: "🚌",
    Shopping: "🛍️",
    Bills: "🧾",
    Other: "📌"
};

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let activeFilter = "All";

// HTML Elements
const form = document.getElementById("transactionForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const message = document.getElementById("formMessage");

// Save Data
function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Currency Format
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// Calculate Total Income, Expense and Balance
function getTotals() {

    const income = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const expense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    return {
        income,
        expense,
        balance: income - expense
    };
}

// Display Summary
function renderSummary() {

    const totals = getTotals();

    document.getElementById("totalIncome").textContent =
        formatCurrency(totals.income);

    document.getElementById("totalExpense").textContent =
        formatCurrency(totals.expense);

    document.getElementById("balance").textContent =
        formatCurrency(totals.balance);

    document.getElementById("balance").style.color =
        totals.balance < 0 ? "#c62828" : "";
}

// Display Transaction History
function renderHistory() {

    const list = document.getElementById("transactionList");
    const empty = document.getElementById("emptyState");

    list.replaceChildren();

    const filtered = transactions
        .filter(item =>
            activeFilter === "All" ||
            item.category === activeFilter
        )
        .slice()
        .reverse();

    empty.hidden = filtered.length > 0;

    if (transactions.length > 0 && filtered.length === 0) {
        empty.textContent = `No transactions in ${activeFilter}.`;
    } else {
        empty.textContent = "No transactions yet. Add your first transaction.";
    }

    filtered.forEach(item => {

        const li = document.createElement("li");
        li.className = "transaction-item";

        const icon = document.createElement("span");
        icon.className = "category-icon";
        icon.textContent = item.type === "income"
            ? "💰"
            : (categoryIcons[item.category] || "📌");

        const info = document.createElement("div");
        info.className = "transaction-info";

        const name = document.createElement("p");
        name.className = "transaction-name";
        name.textContent = item.title;

        const meta = document.createElement("p");
        meta.className = "transaction-meta";
        meta.textContent = `${item.type === "income" ? "Income" : item.category} · ${item.date}`;

        info.append(name, meta);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amount = document.createElement("span");
        amount.className = `transaction-amount ${item.type}`;

        amount.textContent =
            `${item.type === "income" ? "+" : "−"} ${formatCurrency(item.amount)}`;

        const remove = document.createElement("button");
        remove.className = "delete-button";
        remove.type = "button";
        remove.textContent = "×";

        remove.addEventListener("click", () => {
            deleteTransaction(item.id);
        });

        right.append(amount, remove);
        li.append(icon, info, right);

        list.append(li);
    });
}

// Spending Breakdown Chart
function renderChart() {

    const expenses = transactions.filter(
        item => item.type === "expense"
    );

    const total = expenses.reduce(
        (sum, item) => sum + item.amount, 0
    );

    document.getElementById("chartTotal").textContent =
        formatCurrency(total);

    const categories = ["Food", "Travel", "Shopping", "Bills", "Other"];

    const amounts = {};

    categories.forEach(category => {

        amounts[category] = expenses
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0);

    });

    let current = 0;

    const segments = categories
        .filter(category => amounts[category] > 0)
        .map(category => {

            const start = current;

            current += (amounts[category] / total) * 100;

            return `${categoryColors[category]} ${start}% ${current}%`;
        });

    document.getElementById("donut").style.background =
        total > 0
            ? `conic-gradient(${segments.join(", ")})`
            : "conic-gradient(#e9edf3 0% 100%)";

    const legend = document.getElementById("legend");

    legend.replaceChildren();

    categories.forEach(category => {

        if (amounts[category] <= 0) return;

        const percent = Math.round(
            (amounts[category] / total) * 100
        );

        const li = document.createElement("li");

        const dot = document.createElement("span");
        dot.className = "legend-dot";
        dot.style.backgroundColor = categoryColors[category];

        const label = document.createElement("span");
        label.textContent = `${category} — `;

        const value = document.createElement("b");
        value.textContent = `${percent}%`;

        li.append(dot, label, value);
        legend.append(li);
    });

    if (total === 0) {

        const li = document.createElement("li");
        li.textContent = "Add an expense to see your chart.";
        legend.append(li);

    }
}

// Render Complete Application
function renderApp() {
    renderSummary();
    renderHistory();
    renderChart();
}

// Add New Transaction
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;

    if (!title || !Number.isFinite(amount) || amount <= 0) {

        message.textContent =
            "Please enter a valid title and amount.";

        message.style.color = "#c62828";
        return;
    }

    const transaction = {

        id: (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now()),

        title: title,
        amount: amount,
        type: type,
        category: category,

        date: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })

    };

    transactions.push(transaction);

    saveTransactions();

    renderApp();

    form.reset();

    typeInput.value = "expense";

    message.textContent =
        "Transaction added successfully!";

    message.style.color = "#15966b";

});

// Delete Transaction
function deleteTransaction(id) {

    transactions = transactions.filter(
        item => item.id !== id
    );

    saveTransactions();

    renderApp();
}

// Category Filter
document.getElementById("filters").addEventListener("click", function(event) {

    const button = event.target.closest("button[data-filter]");

    if (!button) return;

    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(filter => {

        filter.classList.toggle(
            "active",
            filter === button
        );

    });

    renderHistory();
});

// Clear All Transactions
document.getElementById("clearAll").addEventListener("click", function() {

    if (transactions.length === 0) {
        message.textContent = "There are no transactions to clear.";
        return;
    }

    if (confirm("Are you sure you want to delete all transactions?")) {

        transactions = [];

        saveTransactions();

        renderApp();

        message.textContent = "All transactions cleared.";
    }

});

// Initial Display
renderApp();
