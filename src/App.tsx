import MainPage from "./components/MainPage";
import OctoCat from "./components/OctoCat";
import SideNav from "./components/SideNav";
import ProjectsPage from "./components/project/ProjectsPage";
import WorkPage from "./components/work/WorkPage";

function App() {
    return (
        <div className="w-screen bg-slate-100">
            <SideNav />
            <MainPage />
            <WorkPage />
            <ProjectsPage />
            <OctoCat />
            {/* <ContactPage /> */}
        </div>
    );
}

export default App;
