import React from 'react'
import { Alert, AlertColor, Box, Button, ButtonProps, Card, Chip, Skeleton, Stack } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { ReadyState } from 'react-use-websocket'
import { SerialMessage } from '../contexts/WebSocket/messages'
import { GlobalStateContext } from '../contexts/WebSocket/WebSocketContext'
import ConnPopup from './ConnPopup'
import Controls from './Controls'
import LogFeed, { LogFeedMessage } from './FeedList'
import InputArea from './InputArea'
import SerialSelectorDropdown, { ConnectDispatcher } from './SerialDropdown'
import AlertSnackbar from './AlertSnackbar'

type RedrawProps = { name: string }

// helper component to debug component re-renders
export const Redraws: React.FC<RedrawProps> = ({ name }) => {
    const redraws = React.useRef(0)
    React.useEffect(() => {
        redraws.current += 1
    })
    return <Chip label={name + ':' + redraws.current} />
}

interface SocketStatusAlertProps {
    open: ReadyState
}

// displays an alert shield with socket connection status
// changes severity based on current status
const SocketStatusAlert = React.memo(({ open }: SocketStatusAlertProps) => {
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
        Websocket: {connectionStatus}
    </Alert>
})

interface FeedProps {
    maxEntries?: number
}

type FeedState = {
    messagesHistory: LogFeedMessage[]
    dialogOpen: boolean
    connSelected: string | null
}

// Feed component renders log feed
// it state is associated with the websocket
const Feed: React.FC<FeedProps> = ({ maxEntries = 10 }) => {
    // i see, so it looks like using context values as deps of useEffect
    // causes this component to render twice
    // or, more precisely, setting state inside an effect causes an
    // extra render, which might become an issue
    const { readyState, lastMessage, lastError, accessible } = React.useContext(GlobalStateContext)
    const [state, setState] = React.useState<FeedState>({
        messagesHistory: [],
        dialogOpen: false,
        connSelected: accessible.at(0) || null,
    })

    // populate array of messages from producer
    React.useEffect(() => {
        setState(old => {
            if (!lastMessage) return old // skip null messages
            // also skip duplicate messages: this is a dirty hack
            // around react's strict mode to remove duplicate
            // entries in feed
            if (old.messagesHistory.length > 0 && lastMessage.iat === old.messagesHistory.at(-1)?.iat) {
                console.warn('duplicate message', lastMessage)
                return old
            }
            console.log('updates messages', lastMessage)
            // i removed the upper limit as React window is
            // capable of holding really long lists and adding a "clear" button
            // felt like a really consice solution to this
            // if (old.messagesHistory.length == (maxEntries)) {
            //     old.messagesHistory.shift()
            // }
            return { ...old, messagesHistory: old.messagesHistory.concat(lastMessage) }
        })
    }, [lastMessage])

    React.useEffect(() => {
        if (state.connSelected === null && accessible.length > 0) {
            return setState(old => ({ ...old, connSelected: accessible[0] }))
        }
        if (state.connSelected === null) return
        if (accessible.includes(state.connSelected)) return
        setState(old => ({ ...old, dialogOpen: false }))
    }, [accessible])

    // will open dialog
    const dispatcher = React.useMemo((): ConnectDispatcher => {
        return {
            connect: (name) => {
                console.log(`connects ${name}`)
                setState(old => ({ ...old, dialogOpen: true }))
            },
            select(name) {
                console.log(`you clicked ${name}`)
                setState(old => ({ ...old, connSelected: name }))
            },
        }
    }, [])

    const handleDialogClose = React.useMemo(() => () => {
        setState(old => ({ ...old, dialogOpen: false }))
    }, [])
    const handleClearMessageHistory = React.useCallback(() => setState(old => ({ ...old, messagesHistory: [] })), [])
    const handleClientMessageAdd = React.useMemo(
        () => (m: string) => setState(old => ({
            ...old,
            messagesHistory: old.messagesHistory.concat({
                message: m, sent: true,
                serial: state.connSelected!, iat: new Date().toISOString()
            })
        })),
        [])

    return (
        <>
            <Card elevation={0} sx={{ p: '10px', my: '10px' }}>
                <Stack
                    direction='row'
                    justifyContent='center'
                    spacing={1}
                >
                    <SerialSelectorDropdown
                        serials={accessible.sort()}
                        dispatcher={dispatcher}
                    />
                    <Controls readyState={readyState} />
                    <ClearButton
                        onClick={handleClearMessageHistory}
                        variant='outlined'
                        disableElevation
                        disabled={state.messagesHistory.length === 0}
                    />
                    <SocketStatusAlert open={readyState} />
                </Stack>
            </Card>
            <Card elevation={0} sx={{ p: '10px', my: '10px' }}>
                <Redraws name='feed' />
                <AlertSnackbar />
                <ConnPopup
                    conn={state.connSelected || ""}
                    onClose={handleDialogClose} open={state.dialogOpen}
                />
                {/* JS is a boilerplate-oriented language thus
                I use lines below to trick react-window to drop element sizes once
                the list is cleared (otherwise it would "remember" height for each index and
                reuse that one even after the list contents are cleared. This works nicely
            with memo, too)*/}
                {state.messagesHistory.length === 0 && <MessageSkeleton />}
                {state.messagesHistory.length > 0 && <LogFeed messages={state.messagesHistory} />}
            </Card>
            <Card elevation={0} sx={{
                p: '10px',
                my: '10px',
            }}
            >
                <InputArea
                    connSelected={state.connSelected}
                    onSubmit={handleClientMessageAdd}
                    active={!!state.connSelected && accessible.includes(state.connSelected)}
                />
            </Card>
        </>
    )
}

export default Feed

const MessageSkeleton = React.memo(() => {
    return (
        <Box height={500}>
            <Skeleton variant='rounded' height={500} animation='wave' sx={{ m: '10px' }} />
        </Box>
    )
})


// Button to clear list of messages
const ClearButton: React.FC<ButtonProps> = React.memo((props) => {
    return <Button {...props}>
        <DeleteIcon />
    </Button>
})