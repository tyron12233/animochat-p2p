
interface InterestTagProps {
    interest: string;
    onRemove: (interest: string) => void;
}

const InterestTag: React.FC<InterestTagProps> = ({ interest, onRemove }) => (
    <span className="flex items-center bg-green-600 text-white px-2.5 py-1 rounded-full text-sm font-medium">
        <span>{interest}</span>
        <button onClick={() => onRemove(interest)} className="ml-2 bg-black/10 hover:bg-black/30 w-5 h-5 flex items-center justify-center rounded-full transition-colors">
            &times;
        </button>
    </span>
);
export default InterestTag; 