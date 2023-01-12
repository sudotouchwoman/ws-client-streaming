import { Button, Grid, TextField } from "@mui/material"
import SendIcon from '@mui/icons-material/Send';
import React from "react"
import { GlobalDispatcherContext } from "../contexts/WebSocket/WebSocketContext"
import { Redraws } from "./Feed"

type Props = {
    connSelected: string | null
    active: boolean
    onSubmit: (x: string) => void
}

// Represents message input area and helper components (submit button)
// performs requests
const InputArea: React.FC<Props> = React.memo(({ connSelected, active, onSubmit }) => {
    const textRef = React.useRef('')
    const handleChange = React.useMemo(
        () => (event: React.ChangeEvent<HTMLInputElement>) => {
            textRef.current = event.target.value
        },
        [textRef])
    const { perform } = React.useContext(GlobalDispatcherContext)
    const handleSubmit = React.useCallback(() => {
        if (!textRef.current) return
        if (connSelected === null) return console.warn('cant send to null')
        // send the entered message to server
        onSubmit(textRef.current)
        perform({
            serial: connSelected,
            message: textRef.current
        })
    }, [perform, connSelected])
    const disabled = !active

    return (
        <>
            <Redraws name="input area" />
            <Grid container spacing={2} m='10px'>
                <Grid item xs={11}>
                    <TextInputArea
                        disabled={disabled}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={1}>
                    <Button
                        variant='contained'
                        disableElevation
                        onClick={handleSubmit}
                        disabled={disabled}
                        endIcon={<SendIcon />}
                    >
                        Send
                    </Button>
                </Grid>
            </Grid>
        </>
    )
})

export default InputArea

type TextInputAreaProps = {
    disabled: boolean
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const TextInputArea: React.FC<TextInputAreaProps> = ({ disabled, onChange }) => {
    return (
        <TextField
            id="send-message-input-textarea"
            placeholder="Enter message here"
            onChange={onChange}
            disabled={disabled}
            fullWidth
            multiline>
        </TextField>
    )
}