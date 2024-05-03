import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import ValidateForm from '../../helpers/validateform';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { UserStoreService } from '../../services/user-store.service';
import { ResetPasswordService } from '../../services/reset-password.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  public resetPasswordEmail!: string;
  public isValidEmail!: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: NgToastService,
    private userStoreService: UserStoreService,
    private resetPasswordService: ResetPasswordService) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onEnterKeypress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      this.onLogin();
    }
  }

  onLogin() {
    if (this.loginForm.valid) {
      // send obj to database
      this.authService.login(this.loginForm.value)
        .subscribe({
          next: (res) => {
            this.loginForm.reset();
            this.authService.storeToken(res.accessToken);
            this.authService.storeRefreshToken(res.refreshToken);
            const tokenPayload = this.authService.decodedToken(); // store the name and role of the user in the JWT token
            this.userStoreService.setFullNameForStore(tokenPayload.unique_name);
            this.userStoreService.setRoleForStore(tokenPayload.role);

            this.router.navigate(['dashboard']);
          },
          error: () => {
            this.toast.error({ detail: "ERROR", summary: "Wrong username or password!", duration: 5000 });
          }
        })
    }
    else {
      ValidateForm.validateAllFormFields(this.loginForm);
      this.toast.error({ detail: "ERROR", summary: "Wrong username or password!", duration: 5000 });
    }
  }

  checkValidEmail(event: string) {
    const value = event;
    const pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,3}$/; // regex for validating an email
    this.isValidEmail = pattern.test(value);

    return this.isValidEmail;
  }

  confirmToSend() {
    if (this.checkValidEmail(this.resetPasswordEmail)) {
      console.log(this.resetPasswordEmail);

      //API call

      this.resetPasswordService.sendResetPasswordLink(this.resetPasswordEmail)
        .subscribe({
          next: (res) => {
            this.toast.success({
              detail: 'Success',
              summary: 'Email sent successfully!',
              duration: 3000,
            });

            this.emptyResetPasswordEmailValue();
            const resetPasswordCloseBtnRef = document.getElementById("resetPasswordCloseBtn");
            resetPasswordCloseBtnRef?.click();
          },
          error: (err) => {
            this.toast.error({
              detail: 'ERROR',
              summary: 'Failed to send password link! Please try again.',
              duration: 5000,
            });
          }
        })
    }
  }

  emptyResetPasswordEmailValue() {
    this.resetPasswordEmail = "";
  }
}
