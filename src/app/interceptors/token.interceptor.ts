import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, switchMap, throwError } from 'rxjs';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';
import { TokenApiModel } from '../models/token-api.model';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    constructor(private authService : AuthService, private toast : NgToastService, private router : Router) { }
    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const myToken = this.authService.getToken();

        if(myToken) {
          request = request.clone({
            setHeaders: {Authorization: `Bearer ${myToken}`}
          })
        }

        return next.handle(request).pipe(
          catchError((err:any) => {
            if(err instanceof HttpErrorResponse){
              if(err.status === 401) {
                return this.handleUnAuthorizedError(request, next);
              }
            }
            
            return throwError(() => new Error("Some error occured!"));
          })
        );
    }

    handleUnAuthorizedError(req: HttpRequest<any>, next: HttpHandler) {
      let tokenApiModel = new TokenApiModel();
      tokenApiModel.accessToken = this.authService.getToken()!;
      tokenApiModel.refreshToken = this.authService.getRefreshToken()!;

      return this.authService.renewToken(tokenApiModel)
        .pipe(
          switchMap((data: TokenApiModel) => {
            this.authService.storeRefreshToken(data.refreshToken);
            this.authService.storeToken(data.accessToken);
            req = req.clone({
              setHeaders: {Authorization: `Bearer ${data.accessToken}`}
            })
            return next.handle(req);
          }),
          catchError((err) => {
            return throwError(() =>{
              this.toast.warning({detail:"Warning", summary:"Session has expired. Login again!"});
              this.router.navigate(['login']);
            })
          })
        )
    }
}
