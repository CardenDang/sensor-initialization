import { Link } from "react-router-dom";
import "../styles/styling.css";

function Home() {
    return(
        <main className="home">
            {/* Homepage will have data visualizations, graphs, charts, ML model results for optimal sleeping results */}
            <h1 className="header">
                Sleep Quality Monitor
            </h1>

            {/* Data page will display raw data, similar to Excel file */}
            <section className="data">
                <Link to="/data" className="data.btn">
                    Data
                </Link>
            </section>
        </main>
    );
}

export default Home;