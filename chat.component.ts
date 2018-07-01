import {Component, OnDestroy, OnInit} from '@angular/core';
import {chatService}                  from '../shared/services/chat.service';
import {UsersService}                 from '../shared/services/users.service';

//## new chat user object
interface chatUser {
    msgCount  : number;
    nickname  : string;
    msgHistory: Array<any>;
    isCollapsed:boolean;
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

    chatApp: boolean     = false;
    userLogged:any       = this.userService.getUserLogged();

    chatUserList:    Array<chatUser> = [];
    chatWindowsList: Array<chatUser> = [];

    constructor(private chatservice: chatService, private userService: UsersService) {}

    ngOnInit() {

        this.chatservice.reconnection();

        //## On Connection Fire 'newClient' Event
        if (this.userLogged.hasOwnProperty('firstName') && this.userLogged.hasOwnProperty('lastName')) {

            this.chatservice.newClient(this.userLogged.firstName + ' ' + this.userLogged.lastName );
        }

        //## setup all event listeners
        this.setupEvents();
    }

    setupEvents(){

        //## Event That update users new or disconnected
        this.chatservice
            .updateCurrentUsers()
            .subscribe((users: Array<string>) => {

                let myusername    = this.userLogged.firstName + ' ' + this.userLogged.lastName;

                //## insert to chatUserList the user list
                users.forEach(
                    ( user) => {

                        if (user !== myusername) {

                            let duplicate = false;

                            this.chatUserList.forEach(
                                ( chatUser )=>{
                                    if( chatUser.nickname ==  user ){
                                        duplicate = true;
                                        return false;
                                    }
                                }
                            );

                            if( !duplicate ){
                                let chatUser: chatUser = {
                                    msgCount: 0,
                                    msgHistory: [],
                                    nickname: user,
                                    isCollapsed:false
                                };

                                this.chatUserList.push(chatUser);
                            }
                        }
                    }
                );
            });


        //## System Messages Event
        this.chatservice
            .systemMessage()
            .subscribe((user) => {});


        //## System Messages Event
        this.chatservice
            .userDisconnected()
            .subscribe((user:any) => {

                if( user.count > 1 ){
                    return false;
                }

                let elToRemove:chatUser;

                for(let i=0; i<this.chatUserList.length;i++){

                    if( user.nickname  === this.chatUserList[i].nickname ){
                        elToRemove = this.chatUserList[i];
                    }
                }



                let index: number = this.chatUserList.indexOf(elToRemove);
                if (index !== -1) {
                    this.chatUserList.splice(index, 1);
                }

                index = this.chatWindowsList.indexOf(elToRemove);
                if (index !== -1) {
                    this.chatWindowsList.splice(index, 1);
                }

            });


        //## get new messages Event
        this.chatservice
            .getMessage()
            .subscribe((data: any) => {

                let nicknameToMsg = data.nickname;

                this.chatUserList.forEach(
                    (el) => {
                        if (nicknameToMsg == el.nickname) {
                            el.msgCount = el.msgCount + 1;
                            el.msgHistory.push({msg: data.msg, from: true, socketFrom: data.nickname});
                        }
                    }
                );
            });
    }

    //## when inserted new message to send
    onChatInputTyped(event: any, msgToSend:any, window: chatUser): void {
        if (event.keyCode == 13) {

            this.chatWindowsList.forEach(
                (el) => {
                    if (window.nickname == el.nickname) {

                        el.msgHistory.push({msg: msgToSend.value, from: false, socketFrom: this.userLogged.firstName + ' ' + this.userLogged.lastName});
                    }
                }
            );

            this.chatservice.sendMessage(msgToSend.value, window.nickname);
            msgToSend.value = '';
        }
    }

    //## Fire when close a chat window
    removeWindow(window) {
        const index: number = this.chatWindowsList.indexOf(window);
        if (index !== -1) {
            this.chatWindowsList.splice(index, 1);
        }
    }

    //## Fire when open the user list
    ngChatOpen() {
        this.chatApp = !this.chatApp;
    }

    //## Fire when open new chat window
    addChatWindow(user) {

        user.msgCount = 0;
        if (this.chatWindowsList.length > 0) {
            let duplicate = false;
            this.chatWindowsList.forEach(
                (el) => {

                    if (el.nickname === user.nickname) {
                        duplicate = true;
                        return false;
                    }
                }
            );

            if (!duplicate) {
                this.chatWindowsList.push(user);
            }

        } else {
            this.chatWindowsList.push(user);
        }
    }

    // collapsed chat window
    collapsedWindow( window ){

        window.isCollapsed = !window.isCollapsed;
    }

    //## Fire when component is destroy
    ngOnDestroy(): void {
        this.chatservice.close();
    }
}
