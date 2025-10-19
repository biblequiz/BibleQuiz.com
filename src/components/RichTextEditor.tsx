import 'font-awesome/css/font-awesome.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

import FroalaEditorComponent from 'react-froala-wysiwyg';

interface Props {
    text: string;
    setText: (text: string) => void;
}

export default function RichTextEditor({ text, setText }: Props) {

    return (
        <div className="App">
            <FroalaEditorComponent
                tag='textarea'
                model={text}
                onModelChange={setText}
            />
        </div>);
}