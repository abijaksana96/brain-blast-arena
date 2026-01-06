# 🧠 Brain Blast Arena

**Brain Blast Arena** is a high-energy, interactive quiz competition management system designed for hosting live trivia events. It features a dynamic question display, real-time leaderboard, and operator controls for managing the game flow.

## ✨ Features

-   **Dynamic Question Display**: Large, clear presentation of questions with integrated timers.
-   **Real-time Leaderboard**: Automatically sorted team standings with visual highlights for the top 5 teams.
-   **Keyboard-Based Buzzing**: Streamlined operator controls using keyboard shortcuts to register team buzzes.
-   **Game Flow Control**: Manual "Next Question" override when timers expire to keep the event moving.
-   **Responsive Design**: Built for large screens (projectors) but responsive for operators.

## 🎮 Operator Controls

The game is controlled by an operator. Currently, the most important controls are for the **Buzzer** system during the **Question Display** phase.

### Keyboard Shortcuts (Buzz)
When a team presses their physical button (or raises their hand), the operator presses the corresponding key:

-   **`1` - `9`**: Buzz for **Team 1** through **Team 9**.
-   **`0`**: Buzz for **Team 10**.

> **Note**: Buzzing is only active when the question is being displayed.

### Manual Navigation
-   **Next Question**: When the time runs out, a "Lanjut Soal Berikutnya" button appears in the feedback overlay to manually advance to the next question.

## 🛠️ Tech Stack

-   **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18+ recommended)

### Installation

1.  Clone the repository (if applicable) or navigate to the project directory.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the App

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Running Tests

Run the automation test suite to verify components:
```bash
npm test
```
