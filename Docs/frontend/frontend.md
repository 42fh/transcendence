# **Pong Mobile View Design**

## **1. Navigation Bar**

The **bottom navigation bar** will contain the following buttons:

1. **🏠 Home**: Redirects to the Home screen.
2. **🕹️ Play**: Opens the Mode Selector screen.
3. **💬 Messages/Notifications**: Redirects to the Messages and Notifications screen.
4. **👤 Profile/Account**: Opens the Profile screen.
5. **More/Settings (Optional)**: A "More" button (used in some apps like Chess.com/Slack) or eventually a Settings button (which could be placed eventually also somewhere else) [DECIDE: placement and necessity]
6. **Friends/Users**: [DECIDE: should we add a friends/users button?]
7. **Tournaments**: [DECIDE: should tournaments be accessible from the bottom navigation bar?]

### **General Notes and Questions for the Navigation Bar**

1. **State Feedback**: Icons in the navigation bar could reflect selected/unselected states using a color toggle (black/white). Adaptations are necessary to align with the app's black background and white text theme. [DECIDE: exact color scheme for active/inactive states]
2. **Notification Badge**: The Messages/Notifications icon will include a badge if there are unread notifications (e.g., friend requests, messages, or tournament updates). This badge will be simply another icon with the badge. Google Material UI has already something like this. [DECIDE: badge design and placement]
3. **Play Button**: [DECIDE: Should the play button be present in the navigation bar or accessible only from home?]
4. **Navigation Elements Number and Placement**:
   Maximum of 4-5 elements should be in the bottom navigation bar. Consider moving less frequently used items to the top of the screen:
   - Messages could be placed top-right (Instagram-style)
   - Profile/Account could be top-left (Slack/X-style) or bottom-right (Instagram-style)
     [DECIDE: final navigation layout]
5. **Friends/Users Button**: [DECIDE: Should there be a dedicated "Friends/Users" tab in the navigation bar? How would we access them otherwise?]
6. **Settings Access**:

- **Location Options**:
  1. Within Profile screen
  2. Under "More" menu in navigation bar
- **Recommendation**: Consolidate less-used items under "More" for cleaner UI
  [DECIDE: settings placement and required functionality]

## **2. First-Level Screen from the Navigation Bar**

### **2.1. Home Screen**

**Description**: the home screen!

1. **Title**: Displays the app name ("PONG"). Proposal: Add "Three.js" to emphasize the use of the framework. The title Pong will be 3D and the letters could rotate (maybe in different directions) [DECIDE: title design and rotation]
2. **Play Button**: A prominent button that redirects to the **Mode Selector screen**. Maybe put some fancy CSS in the button. The button could show the 3D island behind. Or we could have some fancy 'dynamic border animation' or some 'neon effect'. [DECIDE: button design style]
3. **Navigation Bar**: Positioned at the bottom of the screen.

**Proposals**:

- Remove the current **logout button** and **tournament button**:
  - Move the logout function to the **Profile screen**.
  - Relocate the tournament button to the navigation bar.
  - Remove completely the Three.js button
  - Remove the greeting, which is lame. Maybe show the name of the user under/above the account icon if we decide to have labels. [DECIDE: greeting/user display method]
- Add a **list of currently online friends** (similar to Instagram Stories). Users can interact with friends to challenge them or start a chat. Users can see friends (the online first) they can chat with or challenge for a game. [DECIDE: friends list implementation]
- Usually apps don't have big titles like "PONG" taking 1/3 of the screen. [DECIDE: title size and placement]

### **2.2. Messages/Notifications Screen**

**Description**:
This screen aggregates all notifications and messages. Users can interact with individual items as follows:

1. **Messages** (Full screen): Clicking a message opens a chat screen.
2. **Friend Requests** (Modal): Clicking opens a modal to **accept**, **reject**, or **dismiss** the request. [DECIDE: friend request interaction flow]
3. **Tournament Updates** (Optional modal/full screen): Clicking provides a modal with more information. For the minimal requirement a simple notification will suffice, we don't need a redirect. [DECIDE: tournament update interaction method]

**Future Consideration**:

- Separate notifications from updates for clearer organization. [DECIDE: notification organization structure]

### **2.3. Profile/Account Screen**

**Description**:
A full-screen view that includes:

1. **Avatar** and **name**, **Email** and other relevant user data.
2. Editable fields for updating user information.

**Decisions to Make**:

1. [DECIDE: Should the **Friends list** be accessible/visible from here?]
2. [DECIDE: Should the **Settings** menu be included in this screen?]
3. [DECIDE: Default avatar selection - space invaders theme or alternative?]
4. Note that the profile screen will be a little bit different from the public visible profile of the user, which will be accessible from the friends list or from the users list. [DECIDE: public vs private profile differences]

### **2.4. Mode Selector Screen**

**Description**:
This screen, triggered by the Play button, allows users to select:

1. **Game Type**: 2D or 3D gameplay.
2. **Mode**:
   - **1v1**: Play against another player.
   - **1vAI**: Play against AI.
   - **Multiplayer**: Play with multiple players.
   - **Solo**: Proposed name: "Gump Mode" (like Forrest Gump playing solo in the movie).
3. **Remote/Local**: For 1v1 or Multiplayer, users can choose between remote or local gameplay.
4. **Extras**: for the Power-ups and stuff. [DECIDE: Which power-ups or extras are we going to implement?]

### **2.5 Friends/User screen**

[DECIDE: Complete screen design and functionality]

### **2.6 Settings screen**

[DECIDE: Complete screen design and functionality]

#### Notes

- The first time the user selects them we will save them as default option so the user will be presented with the same choices the next time they click on play (but of course they can change them)

## **3. General Notes**

1. **UI Color Scheme**:

   - The app currently uses a **black background with white text**. Ensure all icons and UI elements (e.g., Google Material UI icons) are properly adapted to this theme.
   - The icons will reflect **selected/unselected states** using appropriate design adjustments for the black background.

2. **Icon Labels**:

   - [DECIDE: Whether navigation bar icons will include labels and their placement]

3. **Google Material UI**:
   - Use **Google Material UI icons** for consistent design. Alternatives:
     - **Font Awesome**
     - **Feather Icons**
     - **Heroicons**
       [DECIDE: Final icon library selection]

## **4. Resources**

### **Design Inspiration**

- **Mobbin**: [https://mobbin.com](https://mobbin.com)
  _Mobile app design patterns and UI examples_
- **Dribbble**: [https://dribbble.com](https://dribbble.com)
  _UI design inspiration and trends_

### **Icon Libraries**

- **Material Icons**: [https://material.io/icons](https://material.io/icons)
- **Font Awesome**: [https://fontawesome.com](https://fontawesome.com)
- **Feather Icons**: [https://feathericons.com](https://feathericons.com)
- **Heroicons**: [https://heroicons.com](https://heroicons.com)
