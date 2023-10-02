import React from 'react';

const ChatBlock = ({ text, ...props }: any) => {
    return <div>{text}</div>;
};

export function responseToChatBlocks(completion: any) {
    let blocks = [];

    try {
        console.log("Received completion:", completion, typeof completion);

        // Check if completion is a string
        if (typeof completion === "string") {
            // If it starts with '{' or '[', try to parse it as JSON
            if (completion.startsWith('{') || completion.startsWith('[')) {
                try {
                    completion = JSON.parse(completion);
                } catch (error) {
                    console.error("JSON parsing failed, treating as a string:", error);
                }
            }
        }

        // Handle the parsed or original completion
        if (typeof completion === "string") {
            console.log("Still a string");
            blocks.push(<ChatBlock text={completion} />);
        } else if (Array.isArray(completion)) {
            console.log("Is an array");
            for (let block of completion) {
                if (block) {
                    blocks.push(<ChatBlock {...block} />);
                } else {
                    console.warn("Encountered undefined or null block in array");
                }
            }
        } else if (completion) {
            blocks.push(<ChatBlock {...completion} />);
        } else {
            console.warn("Completion is undefined or null");
        }

    } catch (error) {
        console.error("An error occurred while processing the completion:", error);
    }

    console.log(blocks);
    return blocks;
}
