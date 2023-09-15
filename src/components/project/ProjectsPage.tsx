import { PROJECTS } from "../../constants/projects";
import ProjectItem from "./ProjectItem";

const ProjectsPage = () => {
    return (
        <section
            id="projects"
            className="max-w-[1040px] m-auto md:pl-20 p-4 py-16"
        >
            <h1 className="text-4xl font-bold text-center text-[#001b5e]">
                Project
            </h1>
            <p className="text-center py-8 text-base font-normal whitespace-normal text-stone-500">
                Experienced mobile app developer adept in Swift, Kotlin, React
                Native, and more. Transformed e-commerce efficiency, pioneered
                automation testing, and led global collaborations. Specialises
                in crafting tailored event apps for top-tier companies, ensuring
                seamless management, real-time updates, and interactive
                interfaces. Eager to apply expertise in creating impactful and
                innovative solutions.
            </p>
            <div className="flex flex-col">
                {PROJECTS.map((project, index) => (
                    <ProjectItem key={index} {...project} />
                ))}
            </div>
        </section>
    );
};

export default ProjectsPage;
