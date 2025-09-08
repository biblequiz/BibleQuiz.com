import SelectCriteriaSection from './SelectCriteriaSection';
import { useRef, useState } from "react";
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import { QuestionSelectionCriteria } from 'types/services/QuestionGeneratorService';
import DownloadSetDialog from './DownloadSetDialog';

interface Props {
}

export default function MainPage({ }: Props) {
    const generateSetElement = useRef<HTMLDivElement>(null);

    const [generatedSet, setGeneratedSet] = useState<QuestionSelectionCriteria | null>(null);

    return (
        <>
            <div role="alert" className="alert block">
                <div>
                    <FontAwesomeIcon icon="fas faCircleInfo" classNames={["mr-2"]} />
                    <span className="text-lg font-bold">Using the Generator</span>
                </div>
                <div>
                    <ul>
                        <li>Select the rules you want below and click the <i>Generate</i> button.</li>
                        <li>
                            If you want to create a custom set of rules for later use, click
                            the <i>Save as Template</i> button after configuring your rules. These will
                            appear under the <i>My Templates</i> radio button.
                        </li>
                        <li>
                            If you are configuring for a meet, be sure to download the PDF and ScoreKeep file.
                        </li>
                    </ul>
                </div>
            </div>
            <div className="divider" />
            <SelectCriteriaSection
                generateSetElement={generateSetElement}
                isGeneratingSet={!!generatedSet}
                onGenerateSet={setGeneratedSet}
            />
            {generatedSet && (
                <DownloadSetDialog
                    criteria={generatedSet}
                    onClose={() => setGeneratedSet(null)}
                />)}
        </>
    );
}