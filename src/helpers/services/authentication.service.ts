import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private storageKey:string = 'biscicol';
  private currentUserSubject!: BehaviorSubject<any>;
  currentUser!: Observable<any>;
  isLoggedIn:boolean = false;

  constructor(
    private router: Router,
    private toastr: ToastrService
  ) {
    this.checkUser();
  }

  checkUser(){
    let user:any = this.getUserFromStorage();
    if(user && user?.accessToken){
      this.isLoggedIn = true;
      this.currentUserSubject = new BehaviorSubject<any>(user);
      this.currentUser = this.currentUserSubject.asObservable();
    }
    else{
      this.isLoggedIn = false;
      this.currentUserSubject = new BehaviorSubject<any>(null);
      this.currentUser = this.currentUserSubject.asObservable();
    }
  }

  getCurrentUserVal(){
    return this.currentUserSubject.value;
  }

  saveUser(userData:any, username:string){
    if(userData.access_token){
      let user:any = {
        username,
        accessToken: userData.access_token,
        refreshToken: userData.refresh_token,
        oAuthTimestamp: new Date().getTime(),
        ...this.getUserFromStorage()
      }
      localStorage.setItem( this.storageKey, btoa(JSON.stringify(user)) );
    }
  }

  apendUserVal(key:string, val:any){
    const userData = this.getUserFromStorage() || {};
    userData[key] = val;
    localStorage.setItem( this.storageKey, btoa(JSON.stringify(userData)) );
  }

  setCurrentUser(user:any){
    if(JSON.stringify(user) == JSON.stringify(this.currentUserSubject.value)) return;
    this.currentUserSubject.next(user);
    this.currentUser = this.currentUserSubject.asObservable();
    this.isLoggedIn = user ? true : false;
  }

  isTokenExpired():boolean{
    const user = this.getCurrentUserVal();
    if(user && user.accessToken){
      // const decodedUser = jwtDecode(user.accessToken);
      // if(decodedUser && decodedUser.exp){
      //   let currentTime = new Date().getTime();
      //   let tokenExpTime = decodedUser.exp * 1000;
      //   let isTokenExp:any = (tokenExpTime - 2000 > currentTime) ? false : true;
      //   return isTokenExp;
      // }
      // else return true;
      return false;
    }
    else return true;
  }

  logoutUser(){
    this.resetUser();
    this.router.navigate(['/']);
    this.toastr.success('User Logged Out!');
  }

  resetUser(){
    const user = this.getUserFromStorage();
    const newData =  user?.projectId ? { projectId: user?.projectId } : null;
    this.setCurrentUser(null);
    this.isLoggedIn = false;
    if(newData) localStorage.setItem( this.storageKey, btoa(JSON.stringify(newData)) );
    else localStorage.removeItem(this.storageKey);
  }

  getUserFromStorage():any{
    const storedUser:any = localStorage.getItem(this.storageKey);
    const parsedData = storedUser ? atob(storedUser) : null;
    if(parsedData) return JSON.parse(parsedData);
    else return null
  }
}
