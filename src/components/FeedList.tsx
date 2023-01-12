import { List, ListItemText, ListItem, Chip, Tooltip } from '@mui/material'
import React from 'react'
import { ListChildComponentProps, VariableSizeList, areEqual as ListChildAreEqual } from 'react-window'
import { SerialMessage } from '../contexts/WebSocket/messages'
import { Redraws } from './Feed'

export type LogFeedMessage = SerialMessage & {
    sent?: true
}

type LogFeedProps = {
    messages: LogFeedMessage[]
    baseItemSize?: number
}

// LogFeed component renders a VariableSizeList
// of elements provided by parent.
// Memoize it to only rerender once there is a new message
// using a custom areEqual predicate!
// P.S. Glad to see that React supports this feature as
// array comparison sometimes does not work the expected way
const LogFeed = React.memo(({ messages, baseItemSize = 50 }: LogFeedProps) => {
    const ruler = getFeedListItemSize(baseItemSize)
    const itemLenghts = messages.map(x => ruler(x.message))
    return (
        <>
            <Redraws name='log-feed' />
            <VariableSizeList
                width='100%'
                height={500}
                itemData={messages}
                itemSize={x => itemLenghts[x]}
                itemKey={x => `${x}-${messages[x].iat}`}
                itemCount={messages.length}
            >
                {LogFeedItem}
            </VariableSizeList>
        </>
    )
}, (prev, next) => {
    // predicate to check whether props are equal
    return prev.baseItemSize === next.baseItemSize &&
        prev.messages.length === next.messages.length &&
        prev.messages.every((v, i) => v === next.messages[i])
})

export default LogFeed

// Helper components and functions

// utility to compute blob height based on number of lines
export const getFeedListItemSize = (itemSize: number) => (text: string) => (
    text.split('\n').length * itemSize
)

const MultiLineText: React.FC<{ text: string }> =
    React.memo(({ text }) => (
        <List
            component='div'
            disablePadding
            dense
            sx={{ ml: '1rem', }}
        >
            {text.split("\n").map((i, key) => {
                return <ListItemText key={i + key}>{i}</ListItemText>
            })}
        </List>
    ))

// Memoize items to avoid tooltip misbehavior (otherwise it
// reappears on each rerender when hovering on a fixed item)
const LogFeedItem = React.memo((p: ListChildComponentProps<LogFeedMessage[]>) => {
    const { index, style, data } = p
    const line = data[index]
    const ts = new Date(line.iat).toTimeString()
    return (
        <div>
            <ListItem
                style={style}
                key={index + line.iat}
                alignItems='flex-start'
                divider
            >
                <Tooltip title={ts} placement='left-end'>
                    <Chip label={line.serial} color={line?.sent ? 'success' : 'default'} />
                </Tooltip>
                <MultiLineText text={line.message} />
            </ListItem>
        </div>
    )
}, ListChildAreEqual)