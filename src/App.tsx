import ContactPage from "./components/ContactPage";
import MainPage from "./components/MainPage";
import Sidenav from "./components/Sidenav";
import ProjectsPage from "./components/project/ProjectsPage";
import WorkPage from "./components/work/WorkPage";

function App() {
    return (
        <div className="w-screen h-screen bg-red-300">
            <Sidenav />
            <MainPage />
            <WorkPage />
            <ProjectsPage />
            <ContactPage />
        </div>
    );
}

export default App;
