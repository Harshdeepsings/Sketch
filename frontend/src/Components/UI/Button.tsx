
export interface ButtonProps {
    variant: "primary" | "secondary";
    size: "lg" | "md" | "sm";
    text: string;
    StartIcon?: any;
    EndIcon?: any;
    onClick?: () => void;
    loading?: boolean;
}

const VariantStyles = {
    "primary": "bg-black hover:bg-gray-100 text:white transition-colors",
    "secondary": "bg-gray-300 hover:bg-gray-600 text:bg-black transition-colors"
}

const SizeStyles = {
    "sm": "py-1 px-2",
    "md": "py-2 px-4",
    "lg": "py-2.5 px-4"
}

const DefaultStyles = "rounded-md flex justify-center items-center"

export const Button = (props: ButtonProps) => {
    <button onClick={props.onClick} className={`${VariantStyles[props.variant]} ${DefaultStyles} ${SizeStyles[props.size]}`}>
        {props.StartIcon? <div className="pr-2">{props.StartIcon}</div>: null}{props.text}{props.EndIcon? <div className="pr-2">{props.EndIcon}</div>: null}
    </button>
}
