import { FiLink } from "react-icons/fi";
import { WorkModel } from "./WorkModel";

const WorkItem = ({
    start,
    end,
    company,
    title,
    description,
    techStack,
    link,
}: WorkModel) => {
    return (
        <ol className="flex flex-col md:flex-row relative border-l border-stone-200">
            <li className="mb-10 ml-4">
                <div className="absolute w-3 h-3 bg-stone-200 rounded-full mt-1.5 -left-1.5 border-white" />
                <div className="flex flex-wrap gap-4 flex-row items-center justify-start text-xs md:text-sm">
                    <span className="inline-block px-2 py-1 font-semibold text-white bg-[#001b5e] rounded-md">
                        {start} - {end}
                    </span>
                    <span className=" text-lg font-semibold text-[#001b5e]">
                        {title}
                    </span>
                    {link ? (
                        <a
                            href={link}
                            target="_blank"
                            className="my-1 text-sm font-normal leading-none text-stone-400 transition-colors duration-300 hover:text-stone-500 underline cursor-pointer"
                        >
                            <span className="flex items-center transition-transform hover:translate-x-[4px] hover:-translate-y-[4px] duration-200">
                                {company}
                                <FiLink className="ml-1" />
                            </span>
                        </a>
                    ) : (
                        <span className="my-1 text-sm font-normal leading-none text-stone-400">
                            {company}
                        </span>
                    )}
                    <br />
                    <span className="my-2 text-base font-normal whitespace-normal text-stone-500">
                        {description}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {techStack.slice(0, 5).map((tech) => (
                            <span
                                key={tech}
                                className="px-2 py-1 text-sm font-medium text-white bg-[#001b5e] rounded-full cursor-pointer hover:bg-[#537add] transition-colors duration-300"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </li>
        </ol>
    );
};

export default WorkItem;
