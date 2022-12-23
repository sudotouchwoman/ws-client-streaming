import { Alert, AlertColor, Card, ListItem, ListItemText, Snackbar, SnackbarProps, Typography } from '@mui/material'
import React from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import { ReadyState } from 'react-use-websocket'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { SerialMessage } from '../contexts/WebSocket/messages'
import { GlobalStateContext } from '../contexts/WebSocket/WebSocketContext'
import Controls from './Controls'
import SerialSelectorDropdown from './SerialDropdown'

type RedrawProps = {
    name: string
}

// helper component to debug component re-renders
export const Redraws = ({ name }: RedrawProps) => {
    const redraws = useRef(0)
    useEffect(() => {
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
    const renderRows = (p: ListChildComponentProps<string[]>) => {
        const { index, style, data } = p
        return (
            <ListItem style={style} key={data[index]} component='div'>
                <ListItemText primary={data[index]} />
            </ListItem>
        )
    }
    return (
        <>
            <Redraws name='log-feed' />
            <FixedSizeList
                width={500}
                height={500}
                itemData={messages.map((v) => v.message)}
                itemSize={46}
                itemCount={messages.length}
            >
                {renderRows}
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

// Feed component renders log feed
// it state is associated with the websocket
const Feed = ({ maxEntries }: FeedProps) => {
    const [snackbar, setSnackbar] = React.useState(false)
    const [messageHistory, setMessageHistory] = useState<SerialMessage[]>([])
    const { readyState, lastMessage, accessible } = useContext(GlobalStateContext)

    // display snackbar each time there are no
    // serials accessible
    useEffect(() => {
        if (accessible.length > 0) return
        setSnackbar(true)
    }, [accessible])

    // populate array of messages from producer
    useEffect(() => {
        setMessageHistory((old) => {
            if (!lastMessage) return old // skip null messages
            // also skip duplicate messages: this is a dirty hack
            // around react's strict mode to remove duplicate
            // entries in feed
            if (old.length > 0 && lastMessage.iat === old.at(-1)?.iat) {
                console.warn('duplicate message', lastMessage)
                return old
            }
            console.log('updates messages', lastMessage)
            if (old.length == (maxEntries || 10)) {
                old.shift()
            }
            return old.concat(lastMessage)
        })
    }, [lastMessage, setMessageHistory])

    const onSnackbarClose = React.useCallback(() => setSnackbar(false), [])

    return (
        <Card>
            <Redraws name='feed' />
            <Controls readyState={readyState} />
            {/* if there are no accessible serials, open snackbar */}
            {accessible.length === 0 &&
                <AlertSnackbar open={snackbar} onClose={onSnackbarClose} />
            }
            <SerialSelectorDropdown serials={accessible.sort()} />
            <SocketStatusAlert open={readyState} />
            <LogFeed messages={messageHistory} />
        </Card>
    )
}

export default Feed

// This snackbar appears once there are no serial connections
// accessible
const AlertSnackbar = React.memo(({ open, onClose }: SnackbarProps) => {
    return <Snackbar
        open={open}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={onClose}
    >
        <Alert severity='warning'>
            No accessible serial connections!
        </Alert>
    </Snackbar>
})