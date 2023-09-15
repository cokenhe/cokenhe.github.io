import { ReactNode, useState } from "react";
import { AiOutlineHome, AiOutlineMenu, AiOutlineProject } from "react-icons/ai";
import { GrProjects } from "react-icons/gr";

const sections = [
    { icon: <AiOutlineHome size={20} />, title: "Home", id: "main" },
    { icon: <GrProjects size={20} />, title: "Work", id: "work" },
    {
        icon: <AiOutlineProject size={20} />,
        title: "Project",
        id: "projects",
    },
    // { icon: <BsPerson size={20} />, title: "Resume", id: "main" },
    // {
    //     icon: <AiOutlineMail size={20} />,
    //     title: "Contact",
    //     id: "contact",
    // },
];

const SideNav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen((open) => !open);

    const sectionButton = (icon: ReactNode, title: string, id: string) => (
        <a
            key={id + title}
            onClick={toggle}
            href={`#${id}`}
            className="w-[75%] flex justify-center items-center rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-200"
        >
            {icon}
            <span className="pl-4">{title}</span>
        </a>
    );

    const sectionIcon = (key: number, icon: ReactNode, id: string) => (
        <a
            key={key}
            href={`#${id}`}
            className="rounded-full shadow-lg bg-gray-100 shadow-gray-400 m-2 p-4 cursor-pointer hover:scale-110 ease-in duration-300"
        >
            {icon}
        </a>
    );

    return (
        <nav>
            <AiOutlineMenu
                onClick={toggle}
                className="absolute top-4 left-4 z-[99] md:hidden"
            />
            {isOpen && (
                <div className="fixed w-full h-screen bg-white/90 flex flex-col justify-center items-center z-20">
                    <div className="fixed w-full h-screen bg-white/90 flex flex-col justify-center items-center z-20">
                        {sections.map(({ icon, title, id }) =>
                            sectionButton(icon, title, id)
                        )}
                    </div>
                </div>
            )}
            <div className="md:block hidden fixed top-[50%] -translate-y-1/2 z-10">
                <div className="flex flex-col">
                    {sections.map(({ icon, id }, idx) =>
                        sectionIcon(idx, icon, id)
                    )}
                </div>
            </div>
        </nav>
    );
};

export default SideNav;
