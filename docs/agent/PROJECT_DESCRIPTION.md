# Web-Based Harmonium

## Intro

The goal of this project is to build a web based tool that helps people online to get to know the "Eitz Harmonium" which is an instrument that is located at the German Museum in Munich. The instrument can not be shown in the exhibition itself due to size and complexity, so this web tool should be part of the online offers of the museum. While the museums web platform already gives information and picture of the instrument, this tool extends the experience by an interactive instrument and music making platform.

## Features

The tool offers ability to play the harmonium yourself, it can play a pre-programmed piece of music, you can build songs by piecing notes together like in a modern DAW with a timeline. Songs can then be imported and exported from and to MIDI files.

## UI

The UI should be free of typcial modern Ai-generated style elements. It should be kept simple but modern looking. A dark and light theme using variables that are easy to adjust should be implemented.

## Technology

- TypeScript
- React
- SCSS
- tone.js
- Docker
- Nginx

## Code Quality Guidelines

SCSS should be kept as simple as possible. Bigger SCSS contents should be put in a separate component to avoid duplication for easy adjustments.
In general all react components should be free of duplication.