import boutir_1 from "../assets/images/boutir/1.webp";
import boutir_2 from "../assets/images/boutir/2.webp";
import boutir_3 from "../assets/images/boutir/3.webp";
import boutir_4 from "../assets/images/boutir/4.webp";
import boutir_5 from "../assets/images/boutir/5.webp";

import wonderkin_1 from "../assets/images/wonderkin/1.webp";
import wonderkin_2 from "../assets/images/wonderkin/2.webp";
import wonderkin_3 from "../assets/images/wonderkin/3.webp";
import wonderkin_4 from "../assets/images/wonderkin/4.webp";
import wonderkin_5 from "../assets/images/wonderkin/5.webp";
import wonderkin_6 from "../assets/images/wonderkin/6.webp";
import wonderkin_7 from "../assets/images/wonderkin/7.webp";

import aq_1 from "../assets/images/appquick/1.webp";
import aq_2 from "../assets/images/appquick/2.webp";
import aq_3 from "../assets/images/appquick/3.webp";

export const PROJECTS = [
    {
        images: [boutir_1, boutir_2, boutir_3, boutir_4, boutir_5],
        title: "Boutir",
        iosLink: "https://apps.apple.com/hk/app/id917526274?l=en",
        androidLink:
            "https://play.google.com/store/apps/details?id=com.redso.boutir&hl=en_CA&gl=US&pli=1",
        description:
            "Leveraging Swift, Kotlin, TypeScript (React Native), Appium, and WebDriverIO",
        points: [
            "Spearheaded a React Native migration, resulting in a twofold acceleration in development pace and a notable reduction in QA workload.",
            "Implemented Appium for automated testing, optimizing the QA process and bolstering Continuous Integration/Continuous Deployment (CICD) effectiveness.",
            "Successfully facilitated the integration of native components between React Native.",
        ],
    },
    {
        images: [
            wonderkin_1,
            wonderkin_2,
            wonderkin_3,
            wonderkin_4,
            wonderkin_5,
            wonderkin_6,
            wonderkin_7,
        ],
        title: "Wonderfam",
        iosLink: "https://apps.apple.com/hk/app/id1493163920?l=en",
        androidLink:
            "https://play.google.com/store/apps/details?id=com.anxinbao.anxinbaobaby&hl=en_CA&gl=US",
        description: "Using Dart (Flutter) and JIRA",
        points: [
            "Created a user-friendly mobile application with Flutter to enable a seamless BLE connection with smart diapers.",
            "Engineered and structured intuitive chart-based UI elements, delivering users clear and visually appealing representations of diaper wetness data.",
        ],
    },
    {
        images: [aq_1, aq_2, aq_3],
        title: "HKIE GED",
        iosLink: "https://apps.apple.com/hk/app/id1225551220?l=en",
        androidLink:
            "https://play.google.com/store/apps/details?id=co.appquick.hkieged",
        description:
            "Using Swift, Kotlin, JavaScript (Angular), ExpressJS, Firebase, and AWS",
        points: [
            "Crafted bespoke mobile applications for prominent enterprises, elevating event management and enriching attendee engagement.",
            "Devised and executed an intuitive Content Management System (CMS), enabling clients to seamlessly oversee real-time app data updates.",
            "Worked closely with corporate partners to tailor app functionalities, ensuring precise alignment with their unique event requirements.",
        ],
    },
];
