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
            <p className="text-center py-8">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia
                tenetur esse ratione cupiditate modi aperiam aspernatur
                consectetur ut laborum doloribus deserunt dolorem, eos nihil
                fuga animi molestias necessitatibus mollitia! Mollitia?
            </p>
            <div className="grid sm:grid-cols-2 gap-12">
                <ProjectItem />
                <ProjectItem />
                <ProjectItem />
                <ProjectItem />
            </div>
        </section>
    );
};

export default ProjectsPage;
