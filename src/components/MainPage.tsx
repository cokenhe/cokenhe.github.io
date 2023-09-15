import { AiFillMail } from "react-icons/ai";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { TypeAnimation } from "react-type-animation";

const animation = [
    "Mobile Developer 👨‍💻",
    "Frontend Developer 👨‍💻",
    "Gym Lover 🏋️",
    "Gamer 🎮",
    "Foodie 🍔",
];

const StyledIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-full p-2 transition-[colors, transform] hover:bg-gray-300 hover:-translate-y-0.5 duration-200">
        {children}
    </div>
);

const MainPage = () => {
    return (
        <section id="main">
            <img
                className="w-full h-screen object-right"
                src="https://images.unsplash.com/photo-1558676273-dfcb1d43cc9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1628&q=80"
                alt="background"
            />
            <div className="w-full h-screen absolute top-0 left-0 bg-white/50">
                <div className="max-w-[700px] m-auto h-full w-full flex flex-col justify-center lg:items-start items-center">
                    <h1 className="sm:text-5xl text-4xl font-bold text-gray-800">
                        I'm Ken Ho
                    </h1>
                    <h2 className="flex sm:text-3xl text-2xl pt-4 text-gray-800">
                        I'm a
                        <TypeAnimation
                            sequence={animation.flatMap((text) => [text, 1500])}
                            wrapper="div"
                            cursor={true}
                            repeat={Infinity}
                            style={{ fontSize: "1em", paddingLeft: "5px" }}
                        />
                    </h2>
                    <div className="flex justify-between pt-6 max-w-[200px] w-full">
                        <StyledIcon>
                            <FaGithub className="cursor-pointer" size={25} />
                        </StyledIcon>
                        <StyledIcon>
                            <FaLinkedin className="cursor-pointer" size={25} />
                        </StyledIcon>
                        <StyledIcon>
                            <AiFillMail className="cursor-pointer" size={25} />
                        </StyledIcon>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MainPage;
