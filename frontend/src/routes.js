//Student imports
import BrowseCommunities from "components/Student/Communities/BrowseCommunity";
import Dayhouses from "components/Student/Communities/Dayhouses";
import JoinDayhouse from "components/Student/Communities/JoinDayhouse";
import SocietyPage from "components/Student/Communities/SocietyPage";
import JoinSocieties from "components/Student/Communities/JoinSociety";

// @mui icons
import Icon from "@mui/material/Icon";

const routes = [
  // Student Routes Section
  {
    type: "title",
    title: "Student",
    key: "student-section",
  },
  {
    type: "collapse",
    name: "Browse Communities",
    key: "browse-communities",
    icon: <Icon fontSize="small">groups</Icon>,
    route: "/student/communities",
    component: <BrowseCommunities />,
  },
  {
    type: "collapse",
    name: "Explore Dayhouses",
    key: "dayhouses",
    icon: <Icon fontSize="small">apartment</Icon>,
    route: "/student/communities/dayhouses",
    component: <Dayhouses />,
  },

  {
    type: "collapse",
    name: "Dayhouse Actions",
    key: "dayhouse-actions",
    icon: <Icon fontSize="small">home</Icon>,
    collapse: [
      {
        name: "Join Dayhouse",
        key: "join-dayhouse",
        route: "/student/communities/joindayhouses",
        component: <JoinDayhouse />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Society Page",
    key: "society-page",
    icon: <Icon fontSize="small">groups</Icon>,
    route: "/student/communities/societypage",
    component: <SocietyPage />,
  },
  {
    type: "collapse",
    name: "Join Societies",
    key: "join-societies",
    icon: <Icon fontSize="small">group_add</Icon>, // Changed to a more specific icon
    route: "/student/communities/joinsociety",
    component: <JoinSocieties />,
  },
];

export default routes;
