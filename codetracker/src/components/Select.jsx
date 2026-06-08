import { useState } from 'react'
import styles from './Select.module.css'

function Select(props){

    const [selecionado, setSelecionado] = useState(props.options[0].value);

    const lidarComSelecao = (event) => {
        setSelecionado(event.target.value);
    }

    const posicao = props.posicaoLabel || 'cima'; 

    const containerClass = [styles.textInput, styles[posicao]].join(' '); 

    return(
        <div className={containerClass}>
            <label>{props.label}</label>
            <select value={selecionado} onChange={lidarComSelecao}>
               {props.options.map(option => (
                <option value={option.value}>
                    {option.name}
                </option>
               ))}
            </select>
        </div>
    )
}


export default Select;