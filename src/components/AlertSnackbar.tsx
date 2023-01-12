import { Snackbar, Slide, Alert } from "@mui/material"
import React from "react"
import { GlobalStateContext } from "../contexts/WebSocket/WebSocketContext"

interface SnackbarMessage {
    message: string
    key: string
}

interface AlertSnackbarState {
    open: boolean
    messageInfo?: SnackbarMessage
    snackPack: readonly SnackbarMessage[]
}

// This snackbar appears once there are no serial connections
// accessible
const AlertSnackbar = React.memo(() => {
    const { lastError, accessible } = React.useContext(GlobalStateContext)
    const [state, setState] = React.useState<AlertSnackbarState>({
        open: false,
        messageInfo: undefined,
        snackPack: [],
    })

    // process global errors from server
    React.useEffect(() => {
        if (!lastError) return
        const key = new Date().toISOString()
        setState(old => ({
            ...old,
            snackPack: [...old.snackPack, { message: lastError.error, key: key }]
        }))
    }, [lastError])

    // process errors from disconnects
    React.useEffect(() => {
        if (accessible.length > 0) return
        const key = new Date().toISOString()
        setState(old => ({
            ...old,
            snackPack: [...old.snackPack, { message: "No accessible serial connections!", key: key }]
        }))
    }, [`${accessible}`])

    React.useEffect(() => {
        if (state.snackPack.length && !state.messageInfo) {
            // Set a new snack when we don't have an active one
            setState(old => ({ messageInfo: old.snackPack[0], snackPack: old.snackPack.slice(1), open: true }))
        } else if (state.snackPack.length && state.messageInfo && state.open) {
            // Close an active snack when a new one is added
            setState(old => ({ ...old, open: false }))
        }
    }, [state])

    return <Snackbar
        open={state.open}
        key={state.messageInfo ? state.messageInfo.key : undefined}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={(_, reason?: string) => {
            if (reason === "clickaway") {
                return
            }
            setState(old => ({ ...old, open: false }))
        }}
        TransitionComponent={Slide}
        TransitionProps={{ onExited: () => setState(old => ({ ...old, messageInfo: undefined })) }}
    >
        <Alert severity='warning'>
            {state.messageInfo?.message || "Whoops!"}
        </Alert>
    </Snackbar>
})

export default AlertSnackbar
