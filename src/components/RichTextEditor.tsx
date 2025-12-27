import Editor from 'react-simple-wysiwyg';

interface Props {
    text: string;
    setText: (text: string) => void;
    disabled?: boolean;
}

export default function RichTextEditor({ text, setText, disabled = false }: Props) {
    return (
        <Editor
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={disabled}
            style={{ minHeight: "6em", marginTop: "0px" }}
        />);
}