import { works } from "../../constants/works";
import WorkItem from "./WorkItem";

const WorkPage = () => {
    return (
        <section id="work" className="max-w-[1040px] m-auto md:pl-20 p-4 py-16">
            <h1 className="text-4xl font-bold text-center text-['#001b5e']">
                Work
            </h1>

            {works.map((work, idx) => (
                <WorkItem key={idx} {...work} />
            ))}
        </section>
    );
};

export default WorkPage;
