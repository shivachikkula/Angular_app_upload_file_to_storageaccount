import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppInsightsService } from '../services/app-insights.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private appInsights: AppInsightsService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Client Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
        }

        // Log to Application Insights
        this.appInsights.logException(new Error(errorMessage));
        this.appInsights.logTrace(`HTTP Error: ${request.method} ${request.url}`, {
          status: error.status,
          statusText: error.statusText,
          errorMessage: errorMessage
        });

        console.error('HTTP Error:', errorMessage);

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
