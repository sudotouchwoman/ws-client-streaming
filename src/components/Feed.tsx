import { Alert, AlertColor, Card, ListItemButton, ListItemText, Snackbar, Typography } from '@mui/material'
import React from 'react'
import { ReadyState } from 'react-use-websocket'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { SerialMessage } from '../contexts/WebSocket/messages'
import { GlobalStateContext } from '../contexts/WebSocket/WebSocketContext'
import ConnPopup from './ConnPopup'
import Controls from './Controls'
import SerialSelectorDropdown, { ConnectDispatcher } from './SerialDropdown'

type RedrawProps = {
    name: string
}

// helper component to debug component re-renders
export const Redraws = ({ name }: RedrawProps) => {
    const redraws = React.useRef(0)
    React.useEffect(() => {
        redraws.current += 1
    })
    return (
        <Typography variant='body1'>
            {name} redraws: {redraws.current}
        </Typography>
    )
}

type LogFeedProps = {
    messages: SerialMessage[]
}

// LogFeed component renders a FixedSizeList
// of elements provided by parent
const LogFeed = ({ messages }: LogFeedProps) => {
    return (
        <>
            <Redraws name='log-feed' />
            <FixedSizeList
                width={500}
                height={500}
                itemData={messages}
                itemSize={46}
                itemCount={messages.length}
            >
                {(p: ListChildComponentProps<SerialMessage[]>) => {
                    const { index, style, data } = p
                    const line = data[index]
                    return (
                        <ListItemButton style={style} key={line.iat} component='div'>
                            <ListItemText primary={`[${line.serial}] ${line.iat} ${line.message}`} />
                        </ListItemButton>
                    )
                }}
            </FixedSizeList>
        </>
    )
}

interface AlertShieldProps {
    open: ReadyState
}

// displays an alert shield with socket connection status
// changes severity based on current status
const SocketStatusAlert = ({ open }: AlertShieldProps) => {
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[open];

    const severity = (r: ReadyState): AlertColor => {
        if ([ReadyState.CLOSING].includes(r)) return 'warning'
        if ([ReadyState.OPEN].includes(r)) return 'success'
        return 'error'
    }

    return <Alert severity={severity(open)}>
        Websocket connection status: {connectionStatus}
    </Alert>
}

interface FeedProps {
    maxEntries?: number
}

type FeedState = {
    messagesHistory: SerialMessage[]
    dialogOpen: boolean
    connSelected: string | null
}

// Feed component renders log feed
// it state is associated with the websocket
const Feed = ({ maxEntries }: FeedProps) => {
    const [state, setState] = React.useState<FeedState>({
        messagesHistory: [],
        dialogOpen: false,
        connSelected: null
    })
    const { readyState, lastMessage, accessible } = React.useContext(GlobalStateContext)

    // populate array of messages from producer
    React.useEffect(() => {
        setState((old) => {
            if (!lastMessage) return old // skip null messages
            // also skip duplicate messages: this is a dirty hack
            // around react's strict mode to remove duplicate
            // entries in feed
            if (old.messagesHistory.length > 0 && lastMessage.iat === old.messagesHistory.at(-1)?.iat) {
                console.warn('duplicate message', lastMessage)
                return old
            }
            console.log('updates messages', lastMessage)
            if (old.messagesHistory.length == (maxEntries || 10)) {
                old.messagesHistory.shift()
            }
            return { ...old, messagesHistory: old.messagesHistory.concat(lastMessage) }
        })
    }, [lastMessage])

    const hasAccessible = accessible.length !== 0

    React.useEffect(() => {
        if (state.connSelected === null) return
        if (accessible.includes(state.connSelected)) return
        setState((old) => { return { ...old, dialogOpen: false } })
    }, [accessible])

    // will open dialog
    const dispatcher = React.useMemo((): ConnectDispatcher => {
        return {
            dispatch: (some) => {
                console.log(`you clicked ${some}`)
                setState((old) => { return { ...old, dialogOpen: true, connSelected: some } })
            }
        }
    }, [setState])

    const handleDialogClose = React.useMemo(() => () => {
        setState((old) => { return { ...old, dialogOpen: false } })
    }, [setState])

    return (
        <Card>
            <Redraws name='feed' />
            <Controls readyState={readyState} />
            {!hasAccessible && <AlertSnackbar />}
            <ConnPopup conn={state.connSelected || ""} onClose={handleDialogClose} open={state.dialogOpen} />
            <SerialSelectorDropdown serials={accessible.sort()} dispatcher={dispatcher} />
            <SocketStatusAlert open={readyState} />
            <LogFeed messages={state.messagesHistory} />
        </Card>
    )
}

export default Feed

// This snackbar appears once there are no serial connections
// accessible
const AlertSnackbar = React.memo(() => {
    const [closed, setClosed] = React.useState(false)
    return <Snackbar
        open={!closed}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setClosed(true)}
    >
        <Alert severity='warning'>
            No accessible serial connections!
        </Alert>
    </Snackbar>
})