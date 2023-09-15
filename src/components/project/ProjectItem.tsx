import React, { useEffect, useRef, useState } from "react";

interface ProjectItemProps {
    images: string[];
    title: string;
    description: string;
    points?: string[];
}

const ProjectItem: React.FC<ProjectItemProps> = ({
    images,
    title,
    description,
    points,
}) => {
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        const intervalId = setInterval(() => {
            if (containerRef.current) {
                containerRef.current!.scrollLeft += 2;
            }
        }, 10);
        setIntervalId(intervalId);
    };

    const handleMouseLeave = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        if (containerRef.current) {
            containerRef.current.scrollLeft = 0;
        }
    };

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    });

    return (
        <div
            className={`flex md:flex-row md:mx-0 mx-6 items-center flex-col max-w-screen-2xl overflow-hidden bg-white rounded-2xl shadow-2xl md:even:flex-row-reverse my-6`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={containerRef}
                className={`flex basis-2/5 max-w-sm rounded-2xl m-4 shadow-md overflow-hidden`}
            >
                {images.map((imageUrl, index) => (
                    <img
                        key={index}
                        className={`w-full h-full object-contain max-h-96 select-none`}
                        draggable="false"
                        src={imageUrl}
                        alt={title}
                        loading="lazy"
                    />
                ))}
            </div>
            <div className={`basis-3/5 px-6 py-4`}>
                <div className="font-bold text-xl mb-2">{title}</div>
                <p className="text-base font-medium whitespace-normal text-stone-500">
                    {description}
                </p>
                {points && (
                    <ul className="list-disc list-inside mt-4">
                        {points.map((point, index) => (
                            <li
                                key={index}
                                className="text-sm font-normal text-stone-400 flex -mx-4"
                            >
                                <span className="mr-2 self-start">&#8226;</span>
                                <span className=" self-end">{point}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ProjectItem;
