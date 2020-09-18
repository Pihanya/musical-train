import React from 'react';
import '@vkontakte/vkui/dist/vkui.css';
import {Panel, PanelHeader, PanelHeaderButton, IOS, platform, Button, Group, CellButton, Header} from "@vkontakte/vkui";
import {getStore, setStore} from "../store";
import Icon28ChevronBack from "@vkontakte/icons/dist/28/chevron_back";
import Icon24Back from "@vkontakte/icons/dist/24/back";
import WaveSurfer from 'wavesurfer.js';
import RegionPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import "./EditPodcast.css";
import {Icon24Add, Icon24ArrowUturnLeftOutline, Icon24Pause, Icon24Play} from "@vkontakte/icons";
import Timecode from "../views/Timecode";

const osName = platform();

export default class EditPodcast extends React.Component {

    constructor(data) {
        super(data);
        this.state = {
            id: data.id,
            go: data.go,
            podcastFileUrl: null,
            audioBuffer: null,

            waveSurfer: null,
            duration: null,
            isPlaying: false,

            fadeIn: false,
            fadeOut: false,

            prevBuffer: null,

            timecodes: [],
        }

        this.onCutFragmentClicked = this.onCutFragmentClicked.bind(this)
        this.onUndoFragmentClicked = this.onUndoFragmentClicked.bind(this)
        this.onTimecodeAddClicked = this.onTimecodeAddClicked.bind(this)
        this.onTimecodeRemoveClicked = this.onTimecodeRemoveClicked.bind(this)
        this.onPlayPauseClicked = this.onPlayPauseClicked.bind(this)
        this.initWaveSurfer = this.initWaveSurfer.bind(this)
    }

    componentDidMount() {
        this.loadFromStore()
        this.initWaveSurfer()
    }

    updateTrackInStore() {
        setStore({

        })
    }

    initWaveSurfer() {
        const waveSurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4986cc',
            progressColor: '#4986cc',
            cursorColor: '#FF3347',
            height: 96,
            barGap: 3,
            barWidth: 2,
            barHeight: 0.65,
            barRadius: 2,
            fillParent: false,
            scrollParent: true,
            plugins: [
                RegionPlugin.create({}),
                TimelinePlugin.create({
                    container: '#timeline',
                    notchPercentHeight: 40,
                    primaryColor: '#99A2AD',
                    secondaryColor: '#99A2AD',
                    primaryFontColor: '#99A2AD',
                    secondaryFontColor: '#99A2AD',
                    height: 14,
                }),
            ],
        });

        this.setState({
            waveSurfer: waveSurfer
        })

        waveSurfer.on('seek', (r) => {
            const duration = waveSurfer.getDuration();
            const rd = r * duration;
            const rVal = Object.values(waveSurfer.regions.list);
            if (rVal.length > 0 && (rd > rVal[0].end || rd < rVal[0].start)) {
                waveSurfer.clearRegions();
            } else if (rVal.length === 0) {
                const fr = Math.max(0, rd - 5);
                const sr = Math.min(rd + 5, duration);
                waveSurfer.clearRegions();
                waveSurfer.addRegion({
                    start: fr,
                    end: sr
                });
            }
        });
        waveSurfer.on('ready', () => {
            this.setState({duration: waveSurfer.getDuration()});
            setStore({
                duration: waveSurfer.getDuration()
            })
        });
        waveSurfer.on('play', () => {
            console.log("PLAY")
            this.setState({isPlaying: true});
        });
        waveSurfer.on('pause', () => {
            this.setState({isPlaying: false});
        });

        if (this.state.audioBuffer == null) {
            waveSurfer.loadBlob(this.state.podcastFileUrl);
        } else {
            waveSurfer.loadDecodedBuffer(this.state.audioBuffer);
        }

        waveSurfer.on('audioprocess', (time) => {
            if (!waveSurfer) return;
            const duration = waveSurfer.getDuration();
            if (this.state.fadeIn && time < 3) {
                waveSurfer.setVolume(time / 3);
            } else if (this.state.fadeOut && time > duration - 3) {
                waveSurfer.setVolume((duration - time) / 3);
            } else {
                waveSurfer.setVolume(1);
            }
        });
    }

    loadFromStore(performUpdate) {
        const s = getStore()
        const change = {
            podcastFileUrl: s.podcastFileUrl,
            audioBuffer: s.audioBuffer,
            timecodes: s.timecodes
        }

        if(performUpdate) {
            this.setState(change)
        } else {
            this.state = {...this.state, ...change}
        }
    }

    onCutFragmentClicked() {
        // https://stackoverflow.com/q/24551854
        const ws = this.state.waveSurfer;
        ws.pause()

        const rVal = Object.values(ws.regions.list);
        if(rVal.length > 0) {
            const original_buffer = ws.backend.buffer;
            const newLength = ws.getDuration() - (rVal[0].end - rVal[0].start);
            const new_buffer      = ws.backend.ac.createBuffer(original_buffer.numberOfChannels, newLength * original_buffer.sampleRate, original_buffer.sampleRate);

            this.state.prevBuffer = original_buffer

            const first_list_index        = (rVal[0].start * original_buffer.sampleRate);
            const second_list_index       = (rVal[0].end * original_buffer.sampleRate);
            const second_list_mem_alloc   = (original_buffer.length - (rVal[0].end * original_buffer.sampleRate));

            const new_list        = new Float32Array( parseInt( first_list_index ));
            const second_list     = new Float32Array( parseInt( second_list_mem_alloc ));
            const combined        = new Float32Array( new_list.length + second_list.length  );

            original_buffer.copyFromChannel(new_list, 0);
            original_buffer.copyFromChannel(second_list, 0, second_list_index);

            combined.set(new_list);
            combined.set(second_list, first_list_index);

            new_buffer.copyToChannel(combined, 0);
            new_buffer.copyToChannel(combined, 1);

            ws.loadDecodedBuffer(new_buffer);
            setStore({
                audioBuffer: new_buffer
            })
            setTimeout(() => {
                this.setState({duration: ws.getDuration()});
                setStore({
                    duration: ws.getDuration()
                })
            }, 2000);
        }
    }

    onUndoFragmentClicked() {
        if (!this.state.prevBuffer) return;
        try {
            this.state.waveSurfer.pause();
            this.state.waveSurfer.loadDecodedBuffer(this.state.prevBuffer);

            this.state.prevBuffer = null
        } catch (e) {}
    }

    onTimecodeAddClicked() {
        this.state.timecodes.push({
            text: null,
            time: this.state.waveSurfer.getCurrentTime()
        });
        this.setState({});
        setStore({
            timecodes: this.state.timecodes
        })
    };

    onTimecodeRemoveClicked(idx) {
        this.state.timecodes.splice(idx, 1);
        this.setState({});
        setStore({
            timecodes: this.state.timecodes
        })
    };

    onPlayPauseClicked() {
        this.state.waveSurfer.playPause()
    }

    render() {
        return (
            <Panel id={this.state.id}>
                <PanelHeader
                    left={<PanelHeaderButton onClick={this.state.go} data-to="back">
                        {osName === IOS ? <Icon28ChevronBack/> : <Icon24Back/>}
                    </PanelHeaderButton>}
                >
                    Редактирование
                </PanelHeader>
                <div className="wf-container">
                    <div id="timeline"/>
                    <div id="waveform"/>
                </div>
                <div className="btns-container">
                    <Button onClick={this.onPlayPauseClicked} className="square-btn" before={
                        this.state.isPlaying
                            ? <Icon24Pause style={{marginLeft: 12}}/>
                            : <Icon24Play style={{marginLeft: 10}}/>
                    }/>
                    <div style={{display: 'flex'}}>
                        <Button onClick={this.onCutFragmentClicked} className="square-btn" before={<div className="cut"/>} mode="secondary"/>
                        <Button
                            onClick={this.onUndoFragmentClicked}
                            className="square-btn"
                            before={<Icon24ArrowUturnLeftOutline style={{marginLeft: 10}}/>}
                            style={{marginLeft: 4, opacity: this.state.prevBuffer ? 1.0 : 0.5}}
                            mode="secondary"
                        />
                    </div>
                    <div style={{display: 'flex'}}>
                        <Button
                            className="square-btn"
                            before={<div className={`fade-in-${this.state.fadeIn ? 'enabled' : 'disabled'}`}/>}
                            style={{marginRight: 4}}
                            mode={this.state.fadeIn ? 'primary' : 'secondary'}
                            onClick={(e) => this.setState({fadeIn: !this.state.fadeIn})}
                        />
                        <Button
                            className="square-btn"
                            before={<div className={`fade-out-${this.state.fadeOut ? 'enabled' : 'disabled'}`}/>}
                            mode={this.state.fadeOut ? 'primary' : 'secondary'}
                            onClick={(e) => this.setState({fadeOut: !this.state.fadeOut})}
                        />
                    </div>
                </div>
                <Group header={<Header mode="secondary">Таймкоды</Header>}>
                    {this.state.timecodes.map((tc, id) => <Timecode timecode={tc} remove={() => this.onTimecodeRemoveClicked(id)}/>)}
                    <CellButton before={<Icon24Add/>} onClick={this.onTimecodeAddClicked}>Добавить таймкод</CellButton>
                </Group>
            </Panel>
        );
    }
}
