# Finish the existing technician prototype

This plugin targets the existing Solar-Coop file and the user-created **Technican Dahboard** page (126:180). It preserves the original Page 1 designs, adds light counterparts to the 28 existing dark screens, reconnects light navigation, adds editable checklist component states with exact counts, sound controls, theme switching through Workspace settings, and both prototype starting points. It uses separate token collections because the MCP bridge reported a one-mode limit. It does not require Figma MCP calls.

**Prepared and JavaScript syntax checked; not yet executed in Figma.** The connected MCP reached its tool-call quota before the light theme and final controls could be written. The current live file contains the dark screens and navigation on the technician page.

1. Extract this folder.
2. Open the original [Solar-Coop design](https://www.figma.com/design/U5eu0uL1f7b8iA45x6NxwX/Solar-Coop?node-id=126-180) in **Figma Desktop**.
3. Choose **Plugins → Development → Import plugin from manifest** and select this folder's manifest.json. If Figma asks for a plugin ID, create a local development plugin and keep its assigned ID while using this manifest's other fields and code.js.
4. Run **SolarCoop · Finish Technician Light + Dark**. Wait for the completion notification.
5. Select the Dark or Light starting point and click **Present**. Use Workspace settings → Light/Dark to switch themes.

The plugin edits only the technician page and its own token collections. It checks the original non-technician frame names, positions, dimensions and parent page after completion. If a run fails, Undo that plugin run before retrying. Run it in the exact original file; these are existing node IDs, not a generic new-file template.

Photos, audio-test feedback and logout are design demonstrations; the prototype does not access the camera, save repairs, play real audio or change your app account.
