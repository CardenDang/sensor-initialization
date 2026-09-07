import { Link } from "react-router-dom";
import "../styles/styling.css";

function Home() {
    return(
        <main className="home">
            {/* Homepage will have data visualizations and graphs */}
            <h1 className="header">
                Sleep Quality Monitor
            </h1>

            {/* Data page will display raw data, similar to Excel file */}
            <section className="home-sections">
                <Link to="/data" className="data-btn">
                    Data
                </Link>

            {/* Dashboard page has ML model results, optimal sleep results, suggwstions, and overview of user's sleep */}
                <Link to="/dashboard" className="dashboard-btn">
                    Dashboard
                </Link>
            </section>
        </main>
    );
}

export default Home;