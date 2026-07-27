import re

import streamlit as st
import pandas as pd
import plotly.express as px
import requests
from io import StringIO

st.set_page_config(
    page_title="Sales Dashboard",
    page_icon="💰",
    layout="wide"
)

st.markdown("""
<style>
.main { background-color: #f7f8fa; }
.block-container { padding-top: 2rem; padding-left: 3rem; padding-right: 3rem; }
.metric-card {
    background-color: white;
    padding: 25px;
    border-radius: 15px;
    box-shadow: 0px 4px 15px rgba(0,0,0,0.08);
    text-align: center;
}
.metric-title { color: #6b7280; font-size: 16px; margin-bottom: 10px; }
.metric-value { color: #111827; font-size: 30px; font-weight: bold; }
</style>
""", unsafe_allow_html=True)


DOCTOR_COL = "doctor"
SERVICE_COL = "service"


def clean_names(series):
    """Normalise text values so 'ghada', 'Ghada ' and 'GHADA' become one."""
    cleaned = (
        series.astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
        .str.title()
    )
    return cleaned.replace({"": None, "Nan": None, "None": None, "-": None})


def _fix_year(match):
    """Turn typos like 22025 / 20225 back into 2025."""
    year = match.group(0)
    for i in range(len(year) - 1):
        if year[i] == year[i + 1]:
            return year[:i] + year[i + 1:]
    return year


def parse_dates(series):
    """Handle the many date formats typed by hand into the sheet."""
    text = series.astype(str).str.strip()
    text = text.str.replace(r"occt", "Oct", flags=re.I, regex=True)
    text = text.str.replace(r"0ct", "Oct", flags=re.I, regex=True)
    text = text.str.replace(r"[\\/_\.\s]+", "-", regex=True)
    text = text.str.replace(r"-+", "-", regex=True)
    text = text.str.replace(r"(?<=\d)(?=[A-Za-z])", "-", regex=True)
    text = text.str.replace(r"(?<=[A-Za-z])(?=\d)", "-", regex=True)
    text = text.str.replace(r"\b\d{5}\b", _fix_year, regex=True)
    text = text.str.strip("-")

    return pd.to_datetime(
        text,
        dayfirst=True,
        format="mixed",
        errors="coerce"
    )


@st.cache_data
def load_data():
    url = (
        "https://docs.google.com/spreadsheets/d/e/"
        "2PACX-1vQW2sWYraq4amY9_LtQizFMGPUYj99RiNGn9TZUvdEvVaxINKKsF2xv-"
        "AJGv49G3v-pMUK3aoJNROOy/pub"
        "?gid=1417447591&single=true&output=csv"
    )

    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()

    data = pd.read_csv(StringIO(response.text))

    data = data.loc[:, ~data.columns.str.startswith("Unnamed")]
    data.columns = [str(c).strip() for c in data.columns]

    data = data.rename(columns={"Service": "service", "Doctor": "doctor"})

    data["date"] = parse_dates(data["date"])

    sales_columns = ["cash", "instapay", "visa"]
    data[sales_columns] = (
        data[sales_columns].apply(pd.to_numeric, errors="coerce").fillna(0)
    )

    data["total_sales"] = data["cash"] + data["instapay"] + data["visa"]

    for col in (DOCTOR_COL, SERVICE_COL):
        if col in data.columns:
            data[col] = clean_names(data[col])

    return data


def metric_card(title, value):
    if isinstance(value, (int, float)):
        value = f"{value:,.2f}"

    st.markdown(
        f"""
        <div class="metric-card">
            <div class="metric-title">{title}</div>
            <div class="metric-value">{value}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


def ranking_table(frame, column, label):
    """Return a ranked value-count table for a cleaned text column."""
    if column not in frame.columns:
        return pd.DataFrame(columns=["Rank", label, "Count"])

    ranking = (
        frame[column]
        .dropna()
        .value_counts()
        .rename_axis(label)
        .reset_index(name="Count")
    )
    ranking.insert(0, "Rank", range(1, len(ranking) + 1))
    return ranking


def ranking_chart(ranking, label, title):
    fig = px.bar(
        ranking,
        x="Count",
        y=label,
        orientation="h",
        text_auto=True,
        title=title
    )
    fig.update_layout(
        template="plotly_white",
        height=max(400, 28 * len(ranking)),
        yaxis={"categoryorder": "total ascending"}
    )
    st.plotly_chart(fig, use_container_width=True)


data = load_data()

st.sidebar.title("💰 Sales Dashboard")
page = st.sidebar.radio(
    "Navigate",
    ["Today's Sales", "Monthly Sales", "Overall Sales", "Doctors & Services"]
)


if page == "Today's Sales":

    st.title("📅 Today's Sales")
    st.markdown("Monitor today's sales performance across all payment methods.")

    today = pd.Timestamp.today().normalize()
    today_data = data[data["date"].dt.normalize() == today]

    total_sales_today = today_data["total_sales"].sum()
    cash_today = today_data["cash"].sum()
    instapay_today = today_data["instapay"].sum()
    visa_today = today_data["visa"].sum()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        metric_card("Total Sales Today", total_sales_today)
    with col2:
        metric_card("Cash", cash_today)
    with col3:
        metric_card("Instapay", instapay_today)
    with col4:
        metric_card("Visa", visa_today)

    st.divider()

    if today_data.empty:
        st.info("No transactions recorded for today yet.")

    payment_data = pd.DataFrame({
        "Payment Method": ["Cash", "Instapay", "Visa"],
        "Sales": [cash_today, instapay_today, visa_today]
    })

    st.subheader("💳 Today's Sales by Payment Method")

    fig = px.bar(
        payment_data,
        x="Payment Method",
        y="Sales",
        text_auto=".2f",
        title="Sales Distribution by Payment Method"
    )
    fig.update_layout(template="plotly_white", height=450)
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("📋 Today's Transactions")
    st.dataframe(today_data, use_container_width=True)


elif page == "Monthly Sales":

    st.title("🗓️ Monthly Sales")
    st.markdown("Track sales, doctors and services month by month.")

    valid_dates = data.dropna(subset=["date"]).copy()

    if valid_dates.empty:
        st.info("No dated transactions available.")
        st.stop()

    valid_dates["month"] = valid_dates["date"].dt.to_period("M")

    months = sorted(valid_dates["month"].unique(), reverse=True)
    month_labels = [m.strftime("%B %Y") for m in months]

    selected_label = st.selectbox("Select month", month_labels)
    selected_month = months[month_labels.index(selected_label)]

    month_data = valid_dates[valid_dates["month"] == selected_month]

    total_month = month_data["total_sales"].sum()
    cash_month = month_data["cash"].sum()
    instapay_month = month_data["instapay"].sum()
    visa_month = month_data["visa"].sum()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        metric_card("Total Sales", total_month)
    with col2:
        metric_card("Cash", cash_month)
    with col3:
        metric_card("Instapay", instapay_month)
    with col4:
        metric_card("Visa", visa_month)

    previous_month = selected_month - 1
    previous_data = valid_dates[valid_dates["month"] == previous_month]

    if not previous_data.empty:
        previous_total = previous_data["total_sales"].sum()
        change = total_month - previous_total
        percent = (change / previous_total * 100) if previous_total else 0

        st.metric(
            f"vs {previous_month.strftime('%B %Y')}",
            f"{total_month:,.2f}",
            f"{change:,.2f} ({percent:.1f}%)"
        )

    st.divider()

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📈 Daily Sales This Month")

        daily = (
            month_data
            .groupby(month_data["date"].dt.date)["total_sales"]
            .sum()
            .reset_index()
        )
        daily.columns = ["Date", "Sales"]

        fig = px.bar(
            daily,
            x="Date",
            y="Sales",
            text_auto=".2f",
            title=f"Daily Sales — {selected_label}"
        )
        fig.update_layout(template="plotly_white", height=450)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("💳 Payment Methods This Month")

        payment_data = pd.DataFrame({
            "Payment Method": ["Cash", "Instapay", "Visa"],
            "Sales": [cash_month, instapay_month, visa_month]
        })

        fig = px.pie(
            payment_data,
            names="Payment Method",
            values="Sales",
            hole=0.45
        )
        fig.update_layout(template="plotly_white", height=450)
        st.plotly_chart(fig, use_container_width=True)

    st.divider()

    monthly_doctors = ranking_table(month_data, DOCTOR_COL, "Doctor")
    monthly_services = ranking_table(month_data, SERVICE_COL, "Service")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        metric_card("Doctors This Month", f"{len(monthly_doctors):,}")
    with col2:
        metric_card("Services This Month", f"{len(monthly_services):,}")
    with col3:
        if not monthly_doctors.empty:
            top = monthly_doctors.iloc[0]
            metric_card("Top Doctor", f"{top['Doctor']} ({top['Count']:,})")
        else:
            metric_card("Top Doctor", "No data")
    with col4:
        if not monthly_services.empty:
            top = monthly_services.iloc[0]
            metric_card("Top Service", f"{top['Service']} ({top['Count']:,})")
        else:
            metric_card("Top Service", "No data")

    st.divider()

    st.subheader(f"👨‍⚕️ Doctors — {selected_label}")

    if monthly_doctors.empty:
        st.info("No doctor data for this month.")
    else:
        ranking_chart(
            monthly_doctors,
            "Doctor",
            f"Patients per doctor — {selected_label}"
        )
        st.dataframe(
            monthly_doctors,
            use_container_width=True,
            hide_index=True
        )

    st.divider()

    st.subheader(f"🧪 Services — {selected_label}")

    if monthly_services.empty:
        st.info("No service data for this month.")
    else:
        ranking_chart(
            monthly_services,
            "Service",
            f"Services performed — {selected_label}"
        )
        st.dataframe(
            monthly_services,
            use_container_width=True,
            hide_index=True
        )

    st.divider()

    st.subheader("📊 Monthly Comparison")

    monthly_totals = (
        valid_dates
        .groupby("month", as_index=False)["total_sales"]
        .sum()
        .sort_values("month")
    )
    monthly_totals["Month"] = monthly_totals["month"].dt.strftime("%b %Y")

    fig = px.bar(
        monthly_totals,
        x="Month",
        y="total_sales",
        text_auto=".2f",
        title="Total Sales by Month"
    )
    fig.update_layout(
        template="plotly_white",
        height=450,
        yaxis_title="Sales"
    )
    st.plotly_chart(fig, use_container_width=True)

    st.subheader("📋 Transactions This Month")
    st.dataframe(
        month_data.drop(columns=["month"]),
        use_container_width=True
    )


elif page == "Overall Sales":

    st.title("📊 Overall Sales")
    st.markdown("View total sales performance from the beginning of the dataset.")

    total_sales = data["total_sales"].sum()
    total_cash = data["cash"].sum()
    total_instapay = data["instapay"].sum()
    total_visa = data["visa"].sum()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        metric_card("Total Sales", total_sales)
    with col2:
        metric_card("Total Cash", total_cash)
    with col3:
        metric_card("Total Instapay", total_instapay)
    with col4:
        metric_card("Total Visa", total_visa)

    st.divider()

    payment_data = pd.DataFrame({
        "Payment Method": ["Cash", "Instapay", "Visa"],
        "Sales": [total_cash, total_instapay, total_visa]
    })

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("💳 Sales by Payment Method")
        fig = px.pie(
            payment_data,
            names="Payment Method",
            values="Sales",
            hole=0.45
        )
        fig.update_layout(template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        st.subheader("📈 Sales Over Time")
        daily_sales = (
            data.dropna(subset=["date"])
            .groupby("date", as_index=False)["total_sales"]
            .sum()
        )
        fig = px.line(
            daily_sales,
            x="date",
            y="total_sales",
            markers=True,
            title="Daily Sales Trend"
        )
        fig.update_layout(template="plotly_white", height=450)
        st.plotly_chart(fig, use_container_width=True)

    st.subheader("📋 All Transactions")
    st.dataframe(data, use_container_width=True)


elif page == "Doctors & Services":

    st.title("🩺 Doctors & Services")
    st.markdown("Total doctors and services across the whole dataset.")

    valid_dates = data.dropna(subset=["date"])

    if not valid_dates.empty:
        min_date = valid_dates["date"].min().date()
        max_date = valid_dates["date"].max().date()

        date_range = st.date_input(
            "Date range",
            value=(min_date, max_date),
            min_value=min_date,
            max_value=max_date
        )

        if isinstance(date_range, tuple) and len(date_range) == 2:
            start, end = date_range
            filtered = valid_dates[
                (valid_dates["date"].dt.date >= start)
                & (valid_dates["date"].dt.date <= end)
            ]
        else:
            filtered = valid_dates
    else:
        filtered = data

    doctor_ranking = ranking_table(filtered, DOCTOR_COL, "Doctor")
    service_ranking = ranking_table(filtered, SERVICE_COL, "Service")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        metric_card("Total Doctors", f"{len(doctor_ranking):,}")
    with col2:
        metric_card("Total Services", f"{len(service_ranking):,}")
    with col3:
        if not doctor_ranking.empty:
            top = doctor_ranking.iloc[0]
            metric_card(
                "Top Doctor",
                f"{top['Doctor']} ({top['Count']:,} patients)"
            )
        else:
            metric_card("Top Doctor", "No data")
    with col4:
        if not service_ranking.empty:
            top = service_ranking.iloc[0]
            metric_card(
                "Top Service",
                f"{top['Service']} ({top['Count']:,} times)"
            )
        else:
            metric_card("Top Service", "No data")

    st.divider()

    st.subheader("👨‍⚕️ Patients per Doctor")

    if doctor_ranking.empty:
        st.info("No doctor data available for the selected range.")
    else:
        ranking_chart(
            doctor_ranking,
            "Doctor",
            "Doctors ranked by number of patients"
        )
        st.dataframe(
            doctor_ranking,
            use_container_width=True,
            hide_index=True
        )

    st.divider()

    st.subheader("🧪 Most Requested Services")

    if service_ranking.empty:
        st.info("No service data available for the selected range.")
    else:
        ranking_chart(
            service_ranking,
            "Service",
            "Services ranked by number of times performed"
        )
        st.dataframe(
            service_ranking,
            use_container_width=True,
            hide_index=True
        )