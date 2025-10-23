import 'font-awesome/css/font-awesome.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

import Editor from 'react-simple-wysiwyg';

interface Props {
    text: string;
    setText: (text: string) => void;
}

export default function RichTextEditor({ text, setText }: Props) {

    return (
        <div className="App">
            <Editor
                value={text} 
                onChange={event => setText(event.target.value)}
                style={{ minHeight: "6em" }} // ~3 lines
            />
        </div>);
}