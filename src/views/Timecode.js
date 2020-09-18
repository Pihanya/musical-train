import React from 'react';
import {Div, Input, IOS, platform} from "@vkontakte/vkui";
import Icon24DismissDark from '@vkontakte/icons/dist/24/dismiss_dark';
import "./Timecode.css";

const osName = platform();

const Timecode = ({timecode, remove}) => {
    const getTime = (t) => {
        const min = Math.floor(t / 60).toString();
        const sec = Math.floor(t - min * 60).toString();
        return `${min.padStart(2, "0")}:${sec.padStart(2, "0")}`;
    };

    const getSeconds = (s) => {
        const arr = s.split(":");
        if (arr.length === 0) return 0;
        else if (arr.length === 1) return Number.parseInt(arr[0]);
        else return Number.parseInt(arr[0]) * 60 + Number.parseInt(arr[1]);
    };

    return <Div className="timecode">
        {osName === IOS ?
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 0}}>
            <div className="dismiss"
                onClick={remove}
            />
        </div>:
        <Icon24DismissDark
            onClick={remove}
            style={{marginLeft: 12, marginTop: 10}}
        />}
        <Input
            value={timecode.text}
            placeholder="Сцена"
            onChange={(e) => {timecode.text = e.currentTarget.value}}
        />
        <Input
            type="time"
            value={getTime(timecode.time)}
            onChange={(e) => {timecode.time = getSeconds(e.currentTarget.value)}}
        />
    </Div>;
}

export default Timecode;
