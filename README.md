# AI-Powered Kanban Board

This project is a **AI-Powered Kanban Board** that leverages the **Anthropic API** to provide intelligent task decomposition and categorization.

<img src="/readme/screenshot.png" width="800" />

## Features
- Interactive Kanban board for organizing tasks visually.
- Automatically generate subtasks and distribute tasks across lists using AI.
- Keyboard shortcuts for easy navigation and task management.

## Demo

You can see the app [here](https://actamachina.com/kanban). Since the Anthropic Claude 3.5 Haiku API costs are approximately **0.4¢ per KTok**, you will need to supply your own API key.

## Requirements

- Node.js
- Anthropic API key (You can get one [here](https://docs.anthropic.com/en/api/getting-started))

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/tlyleung/kanban.git
    cd kanban
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Run the development server**:
    ```bash
    npm run dev
    ```

4. **Open the app**:
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your **Anthropic API Key** in the input field.
2. Interact with the Kanban board as you would with a normal Kanban board.

## Cost Notice

Be aware that using the Anthropic Claude 3.5 Haiku API incurs costs at approximately **0.4¢ per KTok**. You will need your own API key to use this app.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the GNU General Public License v3.0 License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

This project was built using the following tools and libraries:

- [Pragmatic Drag and Drop](https://github.com/atlassian/pragmatic-drag-and-drop)
- [React Hotkeys Hook](https://github.com/JohannesKlauss/react-hotkeys-hook)
- [Tailwind Catalyst](https://catalyst.tailwindui.com/)
- [Vercel AI SDK](https://github.com/vercel/ai)