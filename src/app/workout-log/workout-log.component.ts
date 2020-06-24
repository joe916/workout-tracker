import { Component, OnInit, Input } from '@angular/core';
import { WorkoutService } from '../core/workout.service';

@Component({
  selector: 'app-workout-log',
  templateUrl: './workout-log.component.html',
  styleUrls: ['./workout-log.component.scss']
})
export class WorkoutLogComponent implements OnInit {

  @Input() selectedUserId;
  @Input() allowDelete;

  displayedColumns: string[] = ['workoutName', 'logTime', 'count', 'points', 'delete'];
  individualLog = false;

  constructor(public workoutService: WorkoutService) { }

  ngOnInit() {
    this.displayedColumns = !this.allowDelete ? ['workoutName', 'logTime', 'count', 'points'] : ['workoutName', 'logTime', 'count', 'points', 'delete'];
  }

  switchLog(event, value) {
    event.preventDefault();
    event.stopPropagation();
    this.individualLog = value;
  }

  deleteLog(event, logItem) {
    event.preventDefault();
    event.stopPropagation();
    this.workoutService.deleteLog(logItem);
  }

}
