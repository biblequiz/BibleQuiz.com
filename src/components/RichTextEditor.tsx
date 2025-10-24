import Editor from 'react-simple-wysiwyg';

interface Props {
    text: string;
    setText: (text: string) => void;
}

export default function RichTextEditor({ text, setText }: Props) {
    return (
        <Editor
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ minHeight: "6em", marginTop: "0px" }}
        />);
}